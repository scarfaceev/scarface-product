import { z } from "zod";

const name = z.string().trim().min(1).max(120);
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const phone = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(7).max(32).regex(/^\+?[0-9][0-9\s().-]*$/).optional(),
);

export const enquirySchema = z.object({
  name: name.optional(),
  fullName: name.optional(),
  email,
  phone,
  interest: z.enum(["Home charger", "Commercial charger", "Consultation", "Maintenance & support", "Other"]),
  message: z.string().trim().min(10).max(5_000),
}).strict()
  .refine((value) => Boolean(value.fullName || value.name), {
    path: ["fullName"],
    message: "Please enter your name.",
  })
  .transform(({ name: formName, fullName, ...value }) => ({
    ...value,
    fullName: fullName ?? formName ?? "",
  }));

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED", "SPAM"]),
}).strict();

export const enquiryIdSchema = z.string().uuid();
export const enquiryListQuerySchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED", "SPAM"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateEnquiryInput = z.infer<typeof enquirySchema>;
