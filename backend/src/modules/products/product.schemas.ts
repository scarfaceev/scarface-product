import { z } from "zod";

export const productListQuerySchema = z.object({
  category: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const productIdSchema = z.string().uuid();

export const productWriteSchema = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10_000),
  category: z.string().trim().min(1).max(100),
  features: z.array(z.string().trim().min(1).max(500)).max(50),
  specifications: z.record(z.string(), z.string().max(500)),
});
