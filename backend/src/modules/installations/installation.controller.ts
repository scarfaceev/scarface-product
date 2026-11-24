import type { RequestHandler } from "express";
import { installationRequestSchema } from "./installation.schemas.js";
import type { InstallationService } from "./installation.service.js";

export function createInstallationController(service: Pick<InstallationService, "create">) {
  const create: RequestHandler = async (req, res) => {
    const input = installationRequestSchema.parse(req.body);
    const request = await service.create(input);
    res.status(201).json({ data: { id: request.id, status: request.status, createdAt: request.createdAt } });
  };
  return { create };
}
