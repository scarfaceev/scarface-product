import type { RequestHandler } from "express";
import { AppError } from "../../utils/app-error.js";
import {
  enquiryIdSchema,
  enquiryListQuerySchema,
  enquirySchema,
  updateEnquiryStatusSchema,
} from "./enquiry.schema.js";
import type { EnquiryService } from "./enquiry.service.js";

export function createEnquiryController(service: Pick<EnquiryService, "create" | "listForAdmin" | "updateStatusForAdmin">) {
  const create: RequestHandler = async (req, res) => {
    const input = enquirySchema.parse(req.body);
    const enquiry = await service.create(input);
    res.status(201).json({
      data: {
        id: enquiry.id,
        status: "received",
        createdAt: enquiry.createdAt,
      },
    });
  };

  const listForAdmin: RequestHandler = async (req, res) => {
    const query = enquiryListQuerySchema.parse(req.query);
    const [items, total] = await service.listForAdmin(query.status, query.page, query.pageSize);
    res.json({
      data: items,
      pagination: { page: query.page, pageSize: query.pageSize, total },
    });
  };

  const updateStatusForAdmin: RequestHandler = async (req, res) => {
    const id = enquiryIdSchema.parse(req.params.id);
    const { status } = updateEnquiryStatusSchema.parse(req.body);
    const enquiry = await service.updateStatusForAdmin(id, status);
    res.json({ data: enquiry });
  };

  return { create, listForAdmin, updateStatusForAdmin };
}

export function adminRoutesNotEnabled(): RequestHandler {
  return (_req, _res, next) => {
    next(new AppError(503, "AUTH_INTEGRATION_PENDING", "Administrative routes are disabled until authentication is integrated."));
  };
}
