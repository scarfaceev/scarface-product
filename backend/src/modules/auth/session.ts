import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";

const COOKIE_NAME = "scarface_session";

function sign(payload: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");
}

export function createSession(req: Request, res: Response, userId: string): void {
  const expiresAt = Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString("base64url");
  const cookieValue = `${payload}.${sign(payload)}`;
  const isSecure = req.secure || env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=${cookieValue}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${env.SESSION_TTL_DAYS * 24 * 60 * 60}`,
    `SameSite=${isSecure ? "None" : "Lax"}`,
    ...(isSecure ? ["Secure"] : []),
  ].join("; "));
}

export function getSessionUserId(req: Request): string | null {
  const cookies = req.headers.cookie;
  if (!cookies) return null;
  const match = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const cookieValue = match.slice(COOKIE_NAME.length + 1);
  const separator = cookieValue.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = cookieValue.slice(0, separator);
  const signature = cookieValue.slice(separator + 1);
  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: string; expiresAt?: number };
    if (!session.userId || !session.expiresAt || session.expiresAt <= Date.now()) return null;
    return session.userId;
  } catch {
    return null;
  }
}

export function clearSession(res: Response): void {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}
