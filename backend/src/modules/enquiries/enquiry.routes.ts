import { Router } from "express";
import { publicFormRateLimit } from "../../middleware/rate-limit.js";
import type { EnquiryService } from "./enquiry.service.js";
import { createEnquiryController } from "./enquiry.controller.js";

export function enquiryRouter(service: Pick<EnquiryService, "create">): Router {
  const router = Router();
  const controller = createEnquiryController(service);
  router.post("/", publicFormRateLimit, controller.create);
  return router;
}
