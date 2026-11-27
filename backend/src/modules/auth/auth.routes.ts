import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request, RequestHandler, Response } from "express";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { createEmailProvider } from "../notifications/email-provider.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/app-error.js";
import {
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerSchema,
} from "./auth.schemas.js";
import { resolveOAuthUser } from "./oauth.accounts.js";
import {
  buildAuthorizationUrl,
  completeAuthorization,
  type OAuthProvider,
  type OAuthTransaction,
} from "./oauth.providers.js";
import { clearSession, createSession, getSessionUserId } from "./session.js";

const providerSchema = z.enum(["google", "microsoft", "apple", "github"]);
const OAUTH_COOKIE_TTL = 600;
const allowedOrigins = new Set([env.FRONTEND_URL, ...env.CORS_ORIGINS]);

function safeUser(user: {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function requireTrustedOrigin(req: Request): void {
  const origin = req.get("origin");
  const fetchSite = req.get("sec-fetch-site");
  if ((origin && !allowedOrigins.has(origin)) || (!origin && fetchSite === "cross-site")) {
    throw new AppError(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed.");
  }
}

function requireTrustedOAuthInitiator(req: Request): void {
  if (req.method === "POST") {
    requireTrustedOrigin(req);
    return;
  }
  const origin = req.get("origin");
  const referer = req.get("referer");
  const fetchSite = req.get("sec-fetch-site");
  let refererOrigin: string | null = null;
  if (referer) {
    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      throw new AppError(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed.");
    }
  }
  if ((origin && !allowedOrigins.has(origin)) ||
    (refererOrigin && !allowedOrigins.has(refererOrigin)) ||
    (fetchSite === "cross-site" && !refererOrigin)) {
    throw new AppError(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed.");
  }
}

function oauthCookieName(provider: OAuthProvider): string {
  return `scarface_oauth_${provider}`;
}

function oauthCookieAttributes(req: Request, provider: OAuthProvider): string[] {
  const isSecure = provider === "apple" || req.secure || env.NODE_ENV === "production";
  return [
    `SameSite=${provider === "apple" ? "None" : "Lax"}`,
    ...(isSecure ? ["Secure"] : []),
  ];
}

function setOAuthTransactionCookie(req: Request, res: Response, provider: OAuthProvider, transaction: OAuthTransaction): void {
  const value = Buffer.from(JSON.stringify(transaction)).toString("base64url");
  res.append("Set-Cookie", [
    `${oauthCookieName(provider)}=${value}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${OAUTH_COOKIE_TTL}`,
    ...oauthCookieAttributes(req, provider),
  ].join("; "));
}

function clearOAuthTransactionCookie(req: Request, res: Response, provider: OAuthProvider): void {
  res.append("Set-Cookie", [
    `${oauthCookieName(provider)}=`,
    "HttpOnly",
    "Path=/",
    "Max-Age=0",
    ...oauthCookieAttributes(req, provider),
  ].join("; "));
}

function readOAuthTransaction(req: Request, provider: OAuthProvider): OAuthTransaction | null {
  const name = oauthCookieName(provider);
  const cookie = req.headers.cookie?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  if (!cookie) return null;

  try {
    const value: unknown = JSON.parse(Buffer.from(cookie.slice(name.length + 1), "base64url").toString("utf8"));
    if (typeof value !== "object" || value === null || !("state" in value) ||
      typeof value.state !== "string" || !("codeVerifier" in value) ||
      typeof value.codeVerifier !== "string") return null;
    if (!/^[A-Za-z0-9_-]{43}$/.test(value.state) || !/^[A-Za-z0-9_-]{43,128}$/.test(value.codeVerifier)) return null;
    if ("nonce" in value && value.nonce !== undefined && typeof value.nonce !== "string") return null;
    return {
      state: value.state,
      codeVerifier: value.codeVerifier,
      ...("nonce" in value && typeof value.nonce === "string" ? { nonce: value.nonce } : {}),
    };
  } catch {
    return null;
  }
}

function callbackParameters(req: Request): URL {
  const url = new URL(`/api/auth/oauth/${req.params.provider}/callback`, env.BACKEND_URL);
  const parameters = req.method === "POST" ? req.body as Record<string, unknown> : req.query;
  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === "string") url.searchParams.set(key, value);
  }
  return url;
}

function loginRedirect(error: string): string {
  const url = new URL("/login.html", env.FRONTEND_URL);
  url.searchParams.set("oauthError", error);
  return url.toString();
}

function appleProfileName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const user: unknown = JSON.parse(value);
    if (typeof user !== "object" || user === null || !("name" in user) ||
      typeof user.name !== "object" || user.name === null) return null;
    const name = user.name as Record<string, unknown>;
    const parts = [name.firstName, name.lastName].filter((part): part is string => typeof part === "string");
    const result = parts.join(" ").trim();
    return result || null;
  } catch {
    return null;
  }
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function createAuthRateLimit(limit: number, skipSuccessfulRequests = true) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests,
  });
}

export function authRouter(): Router {
  const router = Router();
  const credentialRateLimit = createAuthRateLimit(10);
  const resetRateLimit = createAuthRateLimit(5, false);
  const oauthStartRateLimit = createAuthRateLimit(10, false);

  const register: RequestHandler = async (req, res) => {
    requireTrustedOrigin(req);
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "EMAIL_EXISTS", "An account already exists with this email.");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { fullName: input.fullName, email: input.email, phone: input.phone ?? null, passwordHash },
    });
    await createSession(req, res, user.id);
    res.status(201).json({ data: safeUser(user) });
  };

  const login: RequestHandler = async (req, res) => {
    requireTrustedOrigin(req);
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }
    await createSession(req, res, user.id);
    res.json({ data: safeUser(user) });
  };

  const me: RequestHandler = async (req, res) => {
    const userId = await getSessionUserId(req);
    if (!userId) throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    res.json({ data: safeUser(user) });
  };

  const logout: RequestHandler = async (req, res) => {
    requireTrustedOrigin(req);
    await clearSession(req, res);
    res.json({ data: { loggedOut: true } });
  };

  const requestPasswordReset: RequestHandler = async (req, res) => {
    requireTrustedOrigin(req);
    const emailProvider = createEmailProvider();
    if (!emailProvider) {
      throw new AppError(503, "PASSWORD_RESET_UNAVAILABLE", "Password reset email is not configured.");
    }
    const { email } = passwordResetRequestSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = hashResetToken(token);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await prisma.$transaction([
        prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
      ]);
      const resetUrl = new URL("/reset-password.html", env.FRONTEND_URL);
      resetUrl.hash = new URLSearchParams({ token }).toString();
      try {
        await emailProvider.send({
          to: email,
          subject: "Reset your Scarface EV password",
          text: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl}`,
          html: `<p>Use this link to reset your password. It expires in 30 minutes:</p><p><a href="${escapeHtml(resetUrl.toString())}">Reset password</a></p>`,
        });
      } catch (error) {
        await prisma.passwordResetToken.updateMany({
          where: { tokenHash, usedAt: null },
          data: { usedAt: new Date() },
        });
        logger.error({ err: error }, "Password reset email could not be delivered.");
      }
    }
    res.status(202).json({ data: { accepted: true } });
  };

  const resetPassword: RequestHandler = async (req, res) => {
    requireTrustedOrigin(req);
    const input = passwordResetSchema.parse(req.body);
    const tokenHash = hashResetToken(input.token);
    const passwordHash = await bcrypt.hash(input.password, 12);
    await prisma.$transaction(async (transaction) => {
      const token = await transaction.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, expiresAt: true, usedAt: true },
      });
      if (!token || token.usedAt || token.expiresAt <= new Date()) {
        throw new AppError(400, "INVALID_RESET_TOKEN", "This password reset link is invalid or has expired.");
      }
      const marked = await transaction.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (marked.count !== 1) {
        throw new AppError(400, "INVALID_RESET_TOKEN", "This password reset link is invalid or has expired.");
      }
      await transaction.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await transaction.passwordResetToken.updateMany({
        where: { userId: token.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      await transaction.authSession.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
    await clearSession(req, res);
    res.json({ data: { passwordReset: true } });
  };

  const beginOAuth: RequestHandler = async (req, res) => {
    requireTrustedOAuthInitiator(req);
    const parsedProvider = providerSchema.safeParse(req.params.provider);
    if (!parsedProvider.success) throw new AppError(404, "OAUTH_PROVIDER_NOT_FOUND", "This sign-in provider is not supported.");
    const provider: OAuthProvider = parsedProvider.data;
    const transaction: OAuthTransaction = {
      state: randomBytes(32).toString("base64url"),
      codeVerifier: randomBytes(32).toString("base64url"),
      ...(provider === "github" ? {} : { nonce: randomBytes(32).toString("base64url") }),
    };
    try {
      const authorizationUrl = await buildAuthorizationUrl(provider, transaction);
      setOAuthTransactionCookie(req, res, provider, transaction);
      res.redirect(302, authorizationUrl.toString());
    } catch (error) {
      if (error instanceof AppError) {
        res.redirect(302, loginRedirect(error.code === "OAUTH_NOT_CONFIGURED" ? "not_configured" : "failed"));
        return;
      }
      const errorName = error instanceof Error ? error.name : "UnknownError";
      logger.error({ provider, errorName }, "OAuth sign-in could not be started.");
      res.redirect(302, loginRedirect("failed"));
    }
  };

  const finishOAuth: RequestHandler = async (req, res) => {
    const parsedProvider = providerSchema.safeParse(req.params.provider);
    if (!parsedProvider.success) throw new AppError(404, "OAUTH_PROVIDER_NOT_FOUND", "This sign-in provider is not supported.");
    const provider: OAuthProvider = parsedProvider.data;
    const transaction = readOAuthTransaction(req, provider);
    clearOAuthTransactionCookie(req, res, provider);
    if (!transaction) {
      res.redirect(302, loginRedirect("expired"));
      return;
    }

    try {
      const callbackUrl = callbackParameters(req);
      const profile = await completeAuthorization(provider, callbackUrl, transaction, appleProfileName(req.body?.user));
      const user = await resolveOAuthUser(provider, profile);
      await createSession(req, res, user.id);
      res.redirect(302, new URL("/", env.FRONTEND_URL).toString());
    } catch (error) {
      if (error instanceof AppError) {
        logger.warn({ provider, errorCode: error.code }, "OAuth sign-in was not completed.");
        res.redirect(302, loginRedirect(error.code === "OAUTH_NOT_CONFIGURED" ? "not_configured" : "failed"));
        return;
      }
      const errorName = error instanceof Error ? error.name : "UnknownError";
      logger.error({ provider, errorName }, "OAuth sign-in failed unexpectedly.");
      res.redirect(302, loginRedirect("failed"));
    }
  };

  router.post("/register", credentialRateLimit, register);
  router.post("/login", credentialRateLimit, login);
  router.get("/me", me);
  router.post("/logout", credentialRateLimit, logout);
  router.post("/password/forgot", resetRateLimit, requestPasswordReset);
  router.post("/password/reset", resetRateLimit, resetPassword);
  router.get("/oauth/:provider", oauthStartRateLimit, beginOAuth);
  router.post("/oauth/:provider", oauthStartRateLimit, beginOAuth);
  router.get("/oauth/:provider/callback", finishOAuth);
  router.post("/oauth/:provider/callback", finishOAuth);
  return router;
}
