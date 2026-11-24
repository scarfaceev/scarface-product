import type { RequestHandler } from "express";
import { z } from "zod";
import { pageSlugSchema } from "./content.schemas.js";
import type { ContentService } from "./content.service.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export function createContentController(service: Pick<ContentService, "listPublished" | "getPublishedBySlug">) {
  const listPages: RequestHandler = async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const result = await service.listPublished(query.page, query.pageSize);
    res.json({ data: result.items, pagination: result.pagination });
  };
  const getPage: RequestHandler = async (req, res) => {
    const slug = pageSlugSchema.parse(req.params.slug);
    res.json({ data: await service.getPublishedBySlug(slug) });
  };
  return { listPages, getPage };
}
