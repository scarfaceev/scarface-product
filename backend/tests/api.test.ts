import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import type { AppServices } from "../src/app-types.js";

function createServices(): AppServices {
  return {
    enquiries: {
      create: vi.fn().mockResolvedValue({
        id: "c6204c65-eec4-4fd8-9dd4-2feb8fb44885",
        status: "NEW",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    },
    products: {
      listPublished: vi.fn().mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 25, total: 0 } }),
      getPublishedById: vi.fn().mockResolvedValue({ id: "a93acfa0-70b0-4b54-93f5-43a8e06cdbef" }),
    },
    installations: {
      create: vi.fn().mockResolvedValue({
        id: "80a6f4f3-52f7-479c-a5c2-4354ef2c1a4c",
        status: "NEW",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    },
    jobs: {
      listPublished: vi.fn().mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 25, total: 0 } }),
      getPublishedById: vi.fn().mockResolvedValue({ id: "7b0be5ca-43d6-4d4d-b833-ec9b2b2178e4" }),
    },
    applications: {
      create: vi.fn().mockResolvedValue({
        id: "e530a0f4-fb61-4c75-9daa-a7455e352387",
        status: "RECEIVED",
        submittedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    },
    content: {
      listPublished: vi.fn().mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 25, total: 0 } }),
      getPublishedBySlug: vi.fn().mockResolvedValue({ slug: "home", sections: [] }),
    },
  };
}

describe("public API", () => {
  let services: AppServices;
  const app = () => createApp({ services, checkDatabase: async () => undefined });

  beforeEach(() => {
    services = createServices();
  });

  it("accepts the current React form shape and normalizes email", async () => {
    const response = await request(app())
      .post("/api/v1/enquiries")
      .send({
        name: "Example Customer",
        email: " CUSTOMER@EXAMPLE.COM ",
        phone: "",
        interest: "Home charger",
        message: "I would like to discuss a home charger.",
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ status: "received" });
    expect(services.enquiries.create).toHaveBeenCalledWith({
      fullName: "Example Customer",
      email: "customer@example.com",
      phone: undefined,
      interest: "Home charger",
      message: "I would like to discuss a home charger.",
    });
  });

  it("rejects invalid enquiries before invoking persistence", async () => {
    const response = await request(app())
      .post("/api/v1/enquiries")
      .send({ name: "", email: "not-an-email", interest: "Unsupported", message: "short" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(services.enquiries.create).not.toHaveBeenCalled();
  });

  it("rejects email header line breaks in enquiries", async () => {
    const response = await request(app())
      .post("/api/v1/enquiries")
      .send({
        name: "Example Customer",
        email: "customer@example.com\r\nBcc: attacker@example.com",
        interest: "Home charger",
        message: "I would like to discuss a home charger.",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(services.enquiries.create).not.toHaveBeenCalled();
  });

  it("returns paginated published products", async () => {
    const response = await request(app()).get("/api/v1/products?page=2&pageSize=10&category=Tall%20charger");

    expect(response.status).toBe(200);
    expect(services.products.listPublished).toHaveBeenCalledWith("Tall charger", 2, 10);
  });

  it("accepts a job application without a resume upload", async () => {
    const application = {
      jobId: "7b0be5ca-43d6-4d4d-b833-ec9b2b2178e4",
      applicantName: "Example Applicant",
      email: "APPLICANT@EXAMPLE.COM",
      phone: "+1 555 555 0100",
      coverLetter: "I am interested in this role.",
    };

    const response = await request(app()).post("/api/v1/jobs/applications").send(application);

    expect(response.status).toBe(201);
    expect(services.applications.create).toHaveBeenCalledWith({
      ...application,
      email: "applicant@example.com",
    });
  });

  it("does not expose the removed media endpoint", async () => {
    const response = await request(app()).get("/api/v1/media/c6204c65-eec4-4fd8-9dd4-2feb8fb44885");

    expect(response.status).toBe(404);
  });

  it("rejects invalid installation requests before persistence", async () => {
    const response = await request(app()).post("/api/v1/installation-requests").send({});

    expect(response.status).toBe(400);
    expect(services.installations.create).not.toHaveBeenCalled();
  });

  it("returns published CMS page data through the service boundary", async () => {
    const response = await request(app()).get("/api/v1/content/pages/home");

    expect(response.status).toBe(200);
    expect(services.content.getPublishedBySlug).toHaveBeenCalledWith("home");
  });

  it("rejects non-allowlisted browser origins", async () => {
    const response = await request(app())
      .get("/api/v1/jobs")
      .set("Origin", "https://untrusted.example");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ORIGIN_NOT_ALLOWED");
  });

  it("rejects non-allowlisted origins on authentication endpoints", async () => {
    const response = await request(app())
      .post("/api/auth/login")
      .set("Origin", "https://untrusted.example")
      .send({ email: "person@example.com", password: "PassWord123" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ORIGIN_NOT_ALLOWED");
  });

  it("accepts Apple's form-post callback origin for OAuth state validation", async () => {
    const response = await request(app())
      .post("/api/auth/oauth/apple/callback")
      .set("Origin", "https://appleid.apple.com")
      .type("form")
      .send({ code: "provider-code", state: "provider-state" });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("oauthError=expired");
  });

  it("reports database health without exposing internal errors", async () => {
    const response = await request(createApp({
      services,
      checkDatabase: async () => { throw new Error("database credentials must not leak"); },
    })).get("/api/v1/health");

    expect(response.status).toBe(503);
    expect(response.body).not.toHaveProperty("stack");
    expect(JSON.stringify(response.body)).not.toContain("credentials");
  });

  it("does not expose administrative routes without authentication", async () => {
    const response = await request(app()).get("/api/v1/admin/enquiries");
    expect(response.status).toBe(404);
  });
});
