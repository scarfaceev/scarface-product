import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const registrationName = z.string().trim().min(2).max(120).regex(/^[A-Za-z ]+$/, "Enter a valid name.");
const registrationEmail = z.string().trim().email().max(254)
  .regex(/^[^\s@]+@gmail\.com$/i, "Enter a valid Gmail address")
  .transform((value) => value.toLowerCase());
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters.")
  .max(128)
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[0-9]/, "Password must include a number.");
const registrationPassword = passwordSchema.regex(/[^A-Za-z0-9]/, "Password must include a special character.");
const registrationPhone = z.string().trim().min(7).max(32).regex(/^\+?[0-9][0-9\s().-]*$/);

export const completeProfileSchema = z.object({
  phone: registrationPhone,
}).strict();

export const registerSchema = z.object({
  fullName: registrationName,
  email: registrationEmail,
  phone: registrationPhone,
  password: registrationPassword,
}).strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
}).strict();

export const passwordResetRequestSchema = z.object({ email }).strict();

export const passwordResetSchema = z.object({
  token: z.string().min(32).max(128),
  password: passwordSchema,
}).strict();
