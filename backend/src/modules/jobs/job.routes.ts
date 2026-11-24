import { Router } from "express";
import multer from "multer";
import { env } from "../../config/env.js";
import { publicFormRateLimit } from "../../middleware/rate-limit.js";
import type { JobApplicationService, JobService } from "./job.service.js";
import { createJobController } from "./job.controller.js";

export function jobRouter(
  jobs: Pick<JobService, "listPublished" | "getPublishedById">,
  applications: Pick<JobApplicationService, "create">,
): Router {
  const router = Router();
  const controller = createJobController(jobs, applications);
  const resumeUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.MAX_RESUME_SIZE_BYTES, files: 1, fields: 8, parts: 9 },
  }).single("resume");

  router.get("/", controller.list);
  router.post("/applications", publicFormRateLimit, resumeUpload, controller.apply);
  router.get("/:id", controller.getById);
  return router;
}
