import { Router } from "express";
import type { MediaService } from "./media.service.js";
import { createMediaController } from "./media.controller.js";

export function mediaRouter(service: Pick<MediaService, "getPublicAsset">): Router {
  const router = Router();
  router.get("/:id", createMediaController(service).getPublic);
  return router;
}
