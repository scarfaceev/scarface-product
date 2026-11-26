import { z } from "zod";

const fullName = z.string().trim().min(2).max(120);
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string()
  .min(8, "Password must be at least 8 characters.")
  .max(128)
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[0-9]/, "Password must include a number.");
const phone = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(7).max(32).regex(/^\+?[0-9][0-9\s().-]*$/).optional(),
);

export const registerSchema = z.object({
  fullName,
  email,
  phone,
  password,
}).strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
}).strict();
