import { Router } from "express";
import type { ProductService } from "./product.service.js";
import { createProductController } from "./product.controller.js";

export function productRouter(service: Pick<ProductService, "listPublished" | "getPublishedById">): Router {
  const router = Router();
  const controller = createProductController(service);
  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  return router;
}
