import { Router } from "express";
import { publicFormRateLimit } from "../../middleware/rate-limit.js";
import type { JobApplicationService, JobService } from "./job.service.js";
import { createJobController } from "./job.controller.js";

export function jobRouter(
  jobs: Pick<JobService, "listPublished" | "getPublishedById">,
  applications: Pick<JobApplicationService, "create">,
): Router {
  const router = Router();
  const controller = createJobController(jobs, applications);

  router.get("/", controller.list);
  router.post("/applications", publicFormRateLimit, controller.apply);
  router.get("/:id", controller.getById);
  return router;
}
