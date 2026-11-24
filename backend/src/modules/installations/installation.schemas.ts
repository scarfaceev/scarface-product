import { z } from "zod";

const normalizedEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((value) => typeof value === "string" ? value.toUpperCase() : value, z.enum(values));

export const installationRequestSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(32).regex(/^\+?[0-9][0-9\s().-]*$/),
  installationType: normalizedEnum(["HOME", "COMMERCIAL"]),
  propertyType: normalizedEnum(["HOUSE", "APARTMENT", "COMMERCIAL", "INDUSTRIAL", "OTHER"]),
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(120),
  region: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(3).max(24),
  country: z.string().trim().min(2).max(100),
  additionalRequirements: z.string().trim().max(5_000).optional(),
}).strict();

export const installationIdSchema = z.string().uuid();
export const installationStatusSchema = z.object({
  status: normalizedEnum(["NEW", "CONTACTED", "ASSESSMENT_PENDING", "QUOTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
}).strict();

export type CreateInstallationInput = z.infer<typeof installationRequestSchema>;
