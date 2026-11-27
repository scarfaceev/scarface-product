import { createHash, createHmac } from "node:crypto";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";

const database = vi.hoisted(() => ({
  authSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("../src/database/prisma.js", () => ({ prisma: database }));

import { clearSession, createSession, getSessionUserId } from "../src/modules/auth/session.js";

function requestWithCookie(cookie?: string): Request {
  return {
    secure: false,
    headers: cookie ? { cookie } : {},
  } as Request;
}

function responseWithHeaders() {
  const headers = new Map<string, string | string[]>();
  const response = {
    setHeader(name: string, value: string | string[]) {
      headers.set(name, value);
      return this;
    },
    append(name: string, value: string | string[]) {
      headers.set(name, value);
      return this;
    },
  } as Response;
  return { headers, response };
}

describe("database-backed auth sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores only a token hash and validates the opaque session cookie", async () => {
    const request = requestWithCookie();
    const { headers, response } = responseWithHeaders();
    database.authSession.create.mockResolvedValue({});
    database.authSession.findUnique.mockResolvedValue({
      userId: "user-123",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    await createSession(request, response, "user-123");

    const cookieHeader = headers.get("Set-Cookie");
    expect(typeof cookieHeader).toBe("string");
    expect(cookieHeader).toContain("HttpOnly");
    expect(cookieHeader).toContain("SameSite=Lax");
    expect(cookieHeader).not.toContain("Secure");
    const token = (cookieHeader as string).match(/scarface_session=([^;]+)/)?.[1];
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(database.authSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-123",
        tokenHash: createHash("sha256").update(token as string).digest("hex"),
        expiresAt: expect.any(Date),
      }),
    });
    expect(await getSessionUserId(requestWithCookie(`scarface_session=${token}`))).toBe("user-123");
    expect(database.authSession.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: createHash("sha256").update(token as string).digest("hex") },
      select: { userId: true, expiresAt: true, revokedAt: true },
    });
  });

  it("rejects expired and revoked sessions", async () => {
    database.authSession.findUnique
      .mockResolvedValueOnce({ userId: "user-123", expiresAt: new Date(0), revokedAt: null })
      .mockResolvedValueOnce({ userId: "user-123", expiresAt: new Date(Date.now() + 60_000), revokedAt: new Date() });

    expect(await getSessionUserId(requestWithCookie(`scarface_session=${"a".repeat(43)}`))).toBeNull();
    expect(await getSessionUserId(requestWithCookie(`scarface_session=${"b".repeat(43)}`))).toBeNull();
  });

  it("rejects legacy stateless cookies that cannot be revoked server-side", async () => {
    const payload = Buffer.from(JSON.stringify({
      userId: "user-123",
      expiresAt: Date.now() + 60_000,
    })).toString("base64url");
    const signature = createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");

    expect(await getSessionUserId(requestWithCookie(`scarface_session=${payload}.${signature}`))).toBeNull();
    expect(database.authSession.findUnique).not.toHaveBeenCalled();
  });

  it("revokes the server-side session when logging out", async () => {
    const token = "c".repeat(43);
    const { headers, response } = responseWithHeaders();
    database.authSession.updateMany.mockResolvedValue({ count: 1 });

    await clearSession(requestWithCookie(`scarface_session=${token}`), response);

    expect(database.authSession.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: createHash("sha256").update(token).digest("hex"), revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(headers.get("Set-Cookie")).toContain("Max-Age=0");
  });
});
