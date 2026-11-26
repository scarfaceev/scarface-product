import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { clearSession, createSession, getSessionUserId } from "./session.js";

function safeUser(user: { id: string; fullName: string; email: string; phone: string | null; createdAt: Date; updatedAt: Date }) {
  return { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, createdAt: user.createdAt, updatedAt: user.updatedAt };
}

export function authRouter(): Router {
  const router = Router();

  const register: RequestHandler = async (req, res) => {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "EMAIL_EXISTS", "An account already exists with this email.");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { fullName: input.fullName, email: input.email, phone: input.phone ?? null, passwordHash },
    });
    createSession(req, res, user.id);
    res.status(201).json({ data: safeUser(user) });
  };

  const login: RequestHandler = async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }
    createSession(req, res, user.id);
    res.json({ data: safeUser(user) });
  };

  const me: RequestHandler = async (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    res.json({ data: safeUser(user) });
  };

  const logout: RequestHandler = (_req, res) => {
    clearSession(res);
    res.json({ data: { loggedOut: true } });
  };

  router.post("/register", register);
  router.post("/login", login);
  router.get("/me", me);
  router.post("/logout", logout);
  return router;
}
