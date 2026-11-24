import type { RequestHandler } from "express";
import { AppError } from "../../utils/app-error.js";
import { jobApplicationSchema, jobIdSchema, jobListQuerySchema } from "./job.schemas.js";
import type { JobApplicationService, JobService } from "./job.service.js";

export function createJobController(
  jobs: Pick<JobService, "listPublished" | "getPublishedById">,
  applications: Pick<JobApplicationService, "create">,
) {
  const list: RequestHandler = async (req, res) => {
    const query = jobListQuerySchema.parse(req.query);
    const result = await jobs.listPublished(query.page, query.pageSize);
    res.json({ data: result.items, pagination: result.pagination });
  };

  const getById: RequestHandler = async (req, res) => {
    const id = jobIdSchema.parse(req.params.id);
    res.json({ data: await jobs.getPublishedById(id) });
  };

  const apply: RequestHandler = async (req, res) => {
    const input = jobApplicationSchema.parse(req.body);
    if (!req.file) throw new AppError(400, "RESUME_REQUIRED", "Please attach a PDF resume.");
    const application = await applications.create(input, {
      originalName: req.file.originalname,
      buffer: req.file.buffer,
    });
    res.status(201).json({ data: { id: application.id, status: application.status, submittedAt: application.submittedAt } });
  };

  return { list, getById, apply };
}
