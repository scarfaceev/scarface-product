import type { RequestHandler } from "express";
import { productIdSchema, productListQuerySchema } from "./product.schemas.js";
import type { ProductService } from "./product.service.js";

export function createProductController(service: Pick<ProductService, "listPublished" | "getPublishedById">) {
  const list: RequestHandler = async (req, res) => {
    const query = productListQuerySchema.parse(req.query);
    const result = await service.listPublished(query.category, query.page, query.pageSize);
    res.json({ data: result.items, pagination: result.pagination });
  };

  const getById: RequestHandler = async (req, res) => {
    const id = productIdSchema.parse(req.params.id);
    res.json({ data: await service.getPublishedById(id) });
  };

  return { list, getById };
}
