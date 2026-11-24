import { z } from "zod";

export const pageSlugSchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const contentPageWriteSchema = z.object({
  slug: pageSlugSchema,
  title: z.string().trim().min(1).max(200),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  sections: z.array(z.object({
    key: z.string().trim().min(1).max(100),
    kind: z.string().trim().min(1).max(80),
    content: z.record(z.string(), z.unknown()),
    sortOrder: z.number().int().min(0).default(0),
  }).strict()).max(100),
}).strict();

export type ContentPageWriteInput = z.infer<typeof contentPageWriteSchema>;
