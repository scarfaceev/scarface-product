import { Router } from "express";
import { publicFormRateLimit } from "../../middleware/rate-limit.js";
import { createInstallationController } from "./installation.controller.js";
import type { InstallationService } from "./installation.service.js";

export function installationRouter(service: Pick<InstallationService, "create">): Router {
  const router = Router();
  router.post("/", publicFormRateLimit, createInstallationController(service).create);
  return router;
}
