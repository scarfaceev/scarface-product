import { Router } from "express";
import type { ContentService } from "./content.service.js";
import { createContentController } from "./content.controller.js";

export function contentRouter(service: Pick<ContentService, "listPublished" | "getPublishedBySlug">): Router {
  const router = Router();
  const controller = createContentController(service);
  router.get("/pages", controller.listPages);
  router.get("/pages/:slug", controller.getPage);
  return router;
}
