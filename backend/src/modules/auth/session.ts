import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";

const COOKIE_NAME = "scarface_session";
const SESSION_TTL_SECONDS = env.SESSION_TTL_DAYS * 24 * 60 * 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function setSessionCookie(req: Request, res: Response, value: string): void {
  const isSecure = req.secure || env.NODE_ENV === "production";
  res.append("Set-Cookie", [
    `${COOKIE_NAME}=${value}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    `SameSite=${isSecure ? "None" : "Lax"}`,
    ...(isSecure ? ["Secure"] : []),
  ].join("; "));
}

function readSessionCookie(req: Request): string | null {
  const cookies = req.headers.cookie;
  if (!cookies) return null;
  const match = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`));
  return match ? match.slice(COOKIE_NAME.length + 1) : null;
}

export async function createSession(req: Request, res: Response, userId: string): Promise<void> {
  const previousToken = readSessionCookie(req);
  if (previousToken && !previousToken.includes(".") && /^[A-Za-z0-9_-]{43}$/.test(previousToken)) {
    await prisma.authSession.updateMany({
      where: { tokenHash: hashToken(previousToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.authSession.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  setSessionCookie(req, res, token);
}

export async function getSessionUserId(req: Request): Promise<string | null> {
  const token = readSessionCookie(req);
  if (!token) return null;

  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { userId: true, expiresAt: true, revokedAt: true },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  return session.userId;
}

export async function clearSession(req: Request, res: Response): Promise<void> {
  const token = readSessionCookie(req);
  if (token && !token.includes(".") && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    await prisma.authSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  const isSecure = req.secure || env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "Path=/",
    "Max-Age=0",
    `SameSite=${isSecure ? "None" : "Lax"}`,
    ...(isSecure ? ["Secure"] : []),
  ].join("; "));
}
