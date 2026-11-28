import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const database = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  authSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
}));
const passwordHasher = vi.hoisted(() => ({
  hash: vi.fn(async (_password: string, _rounds: number) => "hashed-password"),
  compare: vi.fn(async (_password: string, _hash: string) => false),
}));

vi.mock("../src/database/prisma.js", () => ({ prisma: database, checkDatabase: vi.fn() }));
vi.mock("bcryptjs", () => ({
  default: passwordHasher,
}));

const registeredUser = {
  id: "c6204c65-eec4-4fd8-9dd4-2feb8fb44885",
  fullName: "Example Customer",
  email: "customer@example.com",
  phone: null,
  passwordHash: "hashed-password",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};
const validRegistration = {
  fullName: registeredUser.fullName,
  email: " CUSTOMER@GMAIL.COM ",
  phone: "+1 555 123 4567",
  password: "SecurePass123!",
  termsAccepted: true,
};

describe("authentication routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp({ checkDatabase: async () => undefined });
    database.user.findUnique.mockResolvedValue(null);
    database.user.create.mockResolvedValue(registeredUser);
    database.authSession.create.mockResolvedValue({});
    database.authSession.updateMany.mockResolvedValue({ count: 1 });
  });

  it.each([
    ["invalid email", { ...validRegistration, email: "not-an-email" }, "email"],
    ["missing required fields", {}, "fullName"],
    ["non-Gmail email", { ...validRegistration, email: "customer@example.com" }, "email"],
    ["invalid name", { ...validRegistration, fullName: "Example123" }, "fullName"],
    ["missing phone", { ...validRegistration, phone: undefined }, "phone"],
    ["invalid password", { ...validRegistration, password: "weak" }, "password"],
    ["password without a special character", { ...validRegistration, password: "SecurePass123" }, "password"],
  ])("rejects %s before creating a user", async (_case, body, field) => {
    const response = await request(app).post("/api/auth/register").send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.fields.map((issue: { path: string }) => issue.path)).toContain(field);
    expect(database.user.create).not.toHaveBeenCalled();
  });

  it("requires terms acceptance and never returns the password hash", async () => {
    for (const termsAccepted of [undefined, false]) {
      const rejected = await request(app)
        .post("/api/auth/register")
        .send({ ...validRegistration, termsAccepted });

      expect(rejected.status).toBe(400);
      expect(rejected.body.error.fields.map((issue: { path: string }) => issue.path)).toContain("termsAccepted");
    }
    expect(database.user.create).not.toHaveBeenCalled();

    const response = await request(app).post("/api/auth/register").send(validRegistration);

    expect(response.status).toBe(201);
    expect(database.user.findUnique).toHaveBeenCalledWith({ where: { email: "customer@gmail.com" } });
    expect(database.user.create).toHaveBeenCalledWith({
      data: {
        fullName: "Example Customer",
        email: "customer@gmail.com",
        phone: "+1 555 123 4567",
        passwordHash: "hashed-password",
      },
    });
    expect(passwordHasher.hash).toHaveBeenCalledWith("SecurePass123!", 12);
    expect(response.body.data).not.toHaveProperty("passwordHash");
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate email addresses", async () => {
    database.user.findUnique.mockResolvedValue(registeredUser);

    const response = await request(app).post("/api/auth/register").send(validRegistration);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_EXISTS");
    expect(database.user.create).not.toHaveBeenCalled();
  });

  it("creates a session for valid credentials and returns a safe user", async () => {
    database.user.findUnique.mockResolvedValue(registeredUser);
    passwordHasher.compare.mockResolvedValue(true);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "CUSTOMER@example.com", password: "SecurePass123" });

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe("customer@example.com");
    expect(response.body.data).not.toHaveProperty("passwordHash");
    expect(database.authSession.create).toHaveBeenCalledOnce();
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it.each([
    ["incorrect password", registeredUser, false],
    ["unregistered email", null, false],
  ])("returns the same safe error for %s", async (_case, user, matches) => {
    database.user.findUnique.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(matches);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@example.com", password: "incorrect" });

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
    });
    expect(database.authSession.create).not.toHaveBeenCalled();
  });

  it("persists authentication across requests and revokes the session on logout", async () => {
    const validSession = {
      userId: registeredUser.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    };
    database.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValue(registeredUser);
    database.authSession.findUnique
      .mockResolvedValueOnce(validSession)
      .mockResolvedValueOnce({ ...validSession, revokedAt: new Date() });
    const client = request.agent(app);

    const registration = await client.post("/api/auth/register").send(validRegistration);
    expect(registration.status).toBe(201);

    const currentUser = await client.get("/api/auth/me");
    expect(currentUser.status).toBe(200);
    expect(currentUser.body.data.id).toBe(registeredUser.id);

    const logout = await client.post("/api/auth/logout").send({});
    expect(logout.status).toBe(200);
    expect(database.authSession.updateMany).toHaveBeenCalledOnce();

    const staleSession = await client.get("/api/auth/me");
    expect(staleSession.status).toBe(401);
  });

  it("rejects a missing session at the current-user endpoint", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });
});
