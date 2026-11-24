import type { RequestHandler } from "express";
import { enquirySchema } from "./enquiry.schema.js";
import type { EnquiryService } from "./enquiry.service.js";

export function createEnquiryController(service: Pick<EnquiryService, "create">) {
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

  return { create };
}
