import { z } from "zod";

export const jobIdSchema = z.string().uuid();
export const jobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const jobApplicationSchema = z.object({
  jobId: z.string().uuid(),
  applicantName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(32).regex(/^\+?[0-9][0-9\s().-]*$/),
  coverLetter: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(5_000).optional(),
  ),
}).strict();

export const jobWriteSchema = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(200),
  department: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(20_000),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
  location: z.string().trim().min(1).max(200),
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type JobWriteInput = z.infer<typeof jobWriteSchema>;
