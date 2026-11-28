import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AppError } from "../src/utils/app-error.js";

const database = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  authSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
}));
const oauthMocks = vi.hoisted(() => ({
  resolveOAuthUser: vi.fn(),
  buildAuthorizationUrl: vi.fn(async (_provider: string, _transaction: unknown) =>
    new URL("https://accounts.provider.test/authorize")),
  completeAuthorization: vi.fn(),
  callbackUri: vi.fn((provider: string) => `http://localhost:3001/api/auth/oauth/${provider}/callback`),
}));

vi.mock("../src/database/prisma.js", () => ({ prisma: database, checkDatabase: vi.fn() }));
vi.mock("../src/modules/auth/oauth.accounts.js", () => ({
  resolveOAuthUser: oauthMocks.resolveOAuthUser,
}));
vi.mock("../src/modules/auth/oauth.providers.js", () => ({
  buildAuthorizationUrl: oauthMocks.buildAuthorizationUrl,
  completeAuthorization: oauthMocks.completeAuthorization,
  callbackUri: oauthMocks.callbackUri,
}));

const completeUser = {
  id: "c6204c65-eec4-4fd8-9dd4-2feb8fb44885",
  fullName: "Provider User",
  email: "provider@example.com",
  phone: "+1 555 123 4567",
  passwordHash: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};
const pendingUser = { ...completeUser, phone: null };
const profile = {
  subject: "provider-stable-subject",
  email: "provider@example.com",
  emailVerified: true,
  fullName: "Provider User",
  avatarUrl: null,
};

describe("OAuth callback routes", () => {
  const app = () => createApp({ checkDatabase: async () => undefined });

  beforeEach(() => {
    vi.clearAllMocks();
    database.authSession.create.mockResolvedValue({});
    database.authSession.updateMany.mockResolvedValue({ count: 1 });
    oauthMocks.completeAuthorization.mockResolvedValue(profile);
    oauthMocks.resolveOAuthUser.mockResolvedValue(completeUser);
  });

  it("authenticates an existing Google identity and creates a website session", async () => {
    const client = request.agent(app());
    const start = await client.post("/api/auth/oauth/google").type("form").send({ authPage: "login" });
    expect(start.status).toBe(302);
    expect(start.headers.location).toBe("https://accounts.provider.test/authorize");

    const callback = await client.get("/api/auth/oauth/google/callback?code=auth-code&state=state");

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe("http://localhost:5173/");
    expect(oauthMocks.completeAuthorization).toHaveBeenCalledWith(
      "google",
      expect.any(URL),
      expect.objectContaining({ state: expect.any(String), codeVerifier: expect.any(String) }),
      null,
    );
    expect(oauthMocks.resolveOAuthUser).toHaveBeenCalledWith("google", profile, {});
    expect(database.authSession.create).toHaveBeenCalledOnce();
    expect(String(callback.headers["set-cookie"])).toContain("scarface_session=");
  });

  it("registers a new Apple identity into profile-pending state", async () => {
    oauthMocks.resolveOAuthUser.mockResolvedValue(pendingUser);
    const start = await request(app()).post("/api/auth/oauth/apple").type("form").send({ authPage: "register" });
    expect(start.status).toBe(302);
    const setCookies = start.headers["set-cookie"];
    const oauthCookie = (Array.isArray(setCookies) ? setCookies : setCookies ? [setCookies] : [])
      .find((cookie) => cookie.startsWith("scarface_oauth_apple="))
      ?.split(";")[0];
    expect(oauthCookie).toBeDefined();

    const callback = await request(app())
      .post("/api/auth/oauth/apple/callback")
      .set("Origin", "https://appleid.apple.com")
      .set("Cookie", oauthCookie as string)
      .type("form")
      .send({
        code: "auth-code",
        state: "state",
        user: JSON.stringify({ name: { firstName: "Provider", lastName: "User" } }),
      });

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe("http://localhost:5173/complete-profile.html");
    expect(oauthMocks.completeAuthorization).toHaveBeenCalledWith(
      "apple",
      expect.any(URL),
      expect.objectContaining({ state: expect.any(String), nonce: expect.any(String) }),
      "Provider User",
    );
    expect(oauthMocks.resolveOAuthUser).toHaveBeenCalledWith("apple", profile, {});
    expect(database.authSession.create).toHaveBeenCalledOnce();
  });

  it("registers a new Google identity into profile-pending state", async () => {
    const client = request.agent(app());
    oauthMocks.resolveOAuthUser.mockResolvedValue(pendingUser);
    await client.post("/api/auth/oauth/google").type("form").send({ authPage: "register" });

    const callback = await client.get("/api/auth/oauth/google/callback?code=auth-code&state=state");

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe("http://localhost:5173/complete-profile.html");
    expect(oauthMocks.resolveOAuthUser).toHaveBeenCalledWith("google", profile, {});
  });

  it("authenticates an existing Apple identity and creates the website session", async () => {
    const start = await request(app()).post("/api/auth/oauth/apple").type("form").send({ authPage: "login" });
    const setCookies = start.headers["set-cookie"];
    const oauthCookie = (Array.isArray(setCookies) ? setCookies : setCookies ? [setCookies] : [])
      .find((cookie) => cookie.startsWith("scarface_oauth_apple="))
      ?.split(";")[0];
    expect(oauthCookie).toBeDefined();

    const callback = await request(app())
      .post("/api/auth/oauth/apple/callback")
      .set("Origin", "https://appleid.apple.com")
      .set("Cookie", oauthCookie as string)
      .type("form")
      .send({ code: "auth-code", state: "state" });

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe("http://localhost:5173/");
    expect(oauthMocks.resolveOAuthUser).toHaveBeenCalledWith("apple", profile, {});
    expect(database.authSession.create).toHaveBeenCalledOnce();
  });

  it("sends provider/email collisions through an explicit existing-account sign-in flow", async () => {
    const client = request.agent(app());
    oauthMocks.resolveOAuthUser.mockRejectedValue(new AppError(
      409,
      "OAUTH_ACCOUNT_LINK_REQUIRED",
      "Sign in to your existing account before linking this provider.",
    ));
    await client.post("/api/auth/oauth/google").type("form").send({ authPage: "register" });

    const callback = await client.get("/api/auth/oauth/google/callback?code=auth-code&state=state");

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toContain("/login.html?oauthError=account_link_required&linkProvider=google");
    expect(database.authSession.create).not.toHaveBeenCalled();
  });

  it("does not begin authenticated provider linking without an existing session", async () => {
    const response = await request(app())
      .post("/api/auth/oauth/google/link")
      .type("form")
      .send({});

    expect(response.status).toBe(401);
    expect(oauthMocks.buildAuthorizationUrl).not.toHaveBeenCalled();
  });

  it("links a provider only after the current user is authenticated", async () => {
    const sessionToken = "l".repeat(43);
    database.authSession.findUnique.mockResolvedValue({
      userId: completeUser.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    const start = await request(app())
      .post("/api/auth/oauth/google/link")
      .set("Cookie", `scarface_session=${sessionToken}`)
      .type("form")
      .send({});
    const setCookies = start.headers["set-cookie"];
    const oauthCookie = (Array.isArray(setCookies) ? setCookies : setCookies ? [setCookies] : [])
      .find((cookie) => cookie.startsWith("scarface_oauth_google="))
      ?.split(";")[0];
    expect(start.status).toBe(302);
    expect(oauthCookie).toBeDefined();

    const callback = await request(app())
      .get("/api/auth/oauth/google/callback?code=auth-code&state=state")
      .set("Cookie", `${oauthCookie}; scarface_session=${sessionToken}`);

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe("http://localhost:5173/");
    expect(oauthMocks.resolveOAuthUser).toHaveBeenCalledWith("google", profile, {
      linkToUserId: completeUser.id,
    });
  });

  it("redirects invalid provider tokens to a safe error page", async () => {
    const client = request.agent(app());
    oauthMocks.completeAuthorization.mockRejectedValue(new AppError(
      401,
      "OAUTH_INVALID_RESPONSE",
      "The identity provider returned an invalid sign-in response.",
    ));
    await client.post("/api/auth/oauth/google").type("form").send({ authPage: "login" });

    const callback = await client.get("/api/auth/oauth/google/callback?code=bad-token&state=state");

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toContain("/login.html?oauthError=failed");
    expect(database.authSession.create).not.toHaveBeenCalled();
  });

  it("handles callbacks without a matching state cookie as expired", async () => {
    const callback = await request(app()).get("/api/auth/oauth/apple/callback?code=auth-code&state=state");

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toContain("/login.html?oauthError=expired");
    expect(oauthMocks.completeAuthorization).not.toHaveBeenCalled();
  });

  it("updates a required phone number only for the authenticated session", async () => {
    database.authSession.findUnique.mockResolvedValue({
      userId: pendingUser.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    database.user.update.mockResolvedValue(completeUser);

    const response = await request(app())
      .post("/api/auth/profile/complete")
      .set("Cookie", `scarface_session=${"s".repeat(43)}`)
      .send({ phone: "+1 (555) 123-4567" });

    expect(response.status).toBe(200);
    expect(database.user.update).toHaveBeenCalledWith({
      where: { id: pendingUser.id },
      data: { phone: "+1 (555) 123-4567" },
    });
    expect(response.body.data.phone).toBe(completeUser.phone);
  });

  it("rejects invalid or missing profile phone numbers", async () => {
    database.authSession.findUnique.mockResolvedValue({
      userId: pendingUser.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    const response = await request(app())
      .post("/api/auth/profile/complete")
      .set("Cookie", `scarface_session=${"p".repeat(43)}`)
      .send({ phone: "12" });

    expect(response.status).toBe(400);
    expect(response.body.error.fields.map((field: { path: string }) => field.path)).toContain("phone");
    expect(database.user.update).not.toHaveBeenCalled();
  });
});
