import type { JobStatus, PrismaClient } from "@prisma/client";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { NotificationService } from "../notifications/notification.service.js";
import type { JobWriteInput } from "./job.schemas.js";

export class JobService {
  constructor(private readonly prisma: PrismaClient) {}

  async listPublished(page: number, pageSize: number) {
    const where = { status: "PUBLISHED" as const };
    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        select: { id: true, slug: true, title: true, department: true, description: true, employmentType: true, location: true, publishedAt: true },
        orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);
    return { items, pagination: { page, pageSize, total } };
  }

  async getPublishedById(id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, status: "PUBLISHED" },
      select: { id: true, slug: true, title: true, department: true, description: true, employmentType: true, location: true, publishedAt: true },
    });
    if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The requested job was not found.");
    return job;
  }

  createForAdmin(input: JobWriteInput, status: JobStatus = "DRAFT") {
    return this.prisma.job.create({
      data: { ...input, status, publishedAt: status === "PUBLISHED" ? new Date() : null },
    });
  }

  updateForAdmin(id: string, input: Partial<JobWriteInput>) {
    return this.prisma.job.update({ where: { id }, data: input });
  }

  setStatusForAdmin(id: string, status: JobStatus) {
    return this.prisma.job.update({
      where: { id },
      data: { status, publishedAt: status === "PUBLISHED" ? new Date() : null },
    });
  }
}

export class JobApplicationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly media: import("../media/media.service.js").MediaService,
    private readonly notifications: NotificationService,
  ) {}

  async create(input: import("./job.schemas.js").JobApplicationInput, file: import("../media/storage-adapter.js").IncomingFile) {
    const job = await this.prisma.job.findFirst({
      where: { id: input.jobId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The requested job was not found.");

    const resume = await this.media.storePrivateResume(file);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const application = await transaction.jobApplication.create({
          data: {
            jobId: job.id,
            applicantName: input.applicantName,
            email: input.email,
            phone: input.phone,
            coverLetter: input.coverLetter,
            resumeMediaId: resume.id,
          },
        });
        await this.notifications.enqueueCompanyNotification(
          transaction,
          "JOB_APPLICATION_ADMIN",
          { jobApplicationId: application.id },
          application.id,
        );
        if (env.SEND_CUSTOMER_ACK) {
          await transaction.notificationOutbox.create({
            data: {
              type: "JOB_APPLICATION_ACK",
              recipient: application.email,
              dedupeKey: `JOB_APPLICATION_ACK:${application.id}:customer`,
              jobApplicationId: application.id,
            },
          });
        }
        return application;
      });
    } catch (error) {
      await this.media.deleteUnattachedAsset(resume.id);
      throw error;
    }
  }

  listForAdmin(status: import("@prisma/client").ApplicationStatus | undefined, page: number, pageSize: number) {
    const where = status ? { status } : {};
    return Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        include: { job: true, resume: true },
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.jobApplication.count({ where }),
    ]);
  }

  updateStatusForAdmin(id: string, status: import("@prisma/client").ApplicationStatus) {
    return this.prisma.jobApplication.update({ where: { id }, data: { status } });
  }
}
