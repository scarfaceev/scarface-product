import { Router } from "express";
import type { AppServices } from "../app-types.js";
import { contentRouter } from "../modules/cms/content.routes.js";
import { enquiryRouter } from "../modules/enquiries/enquiry.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { installationRouter } from "../modules/installations/installation.routes.js";
import { jobRouter } from "../modules/jobs/job.routes.js";
import { productRouter } from "../modules/products/product.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";

export function apiV1Router(services: AppServices, checkDatabase: () => Promise<void>): Router {
  const router = Router();
  router.use("/health", healthRouter(checkDatabase));
  router.use("/enquiries", enquiryRouter(services.enquiries));
  router.use("/products", productRouter(services.products));
  router.use("/installation-requests", installationRouter(services.installations));
  router.use("/jobs", jobRouter(services.jobs, services.applications));
  router.use("/content", contentRouter(services.content));
  router.use("/auth", authRouter());
  return router;
}
