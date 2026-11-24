import type { InstallationStatus, PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { NotificationService } from "../notifications/notification.service.js";
import type { CreateInstallationInput } from "./installation.schemas.js";

export class InstallationService {
  constructor(private readonly prisma: PrismaClient, private readonly notifications: NotificationService) {}

  async create(input: CreateInstallationInput) {
    return this.prisma.$transaction(async (transaction) => {
      const request = await transaction.installationRequest.create({ data: input });
      await this.notifications.enqueueCompanyNotification(
        transaction,
        "INSTALLATION_ADMIN",
        { installationRequestId: request.id },
        request.id,
      );
      return request;
    });
  }

  listForAdmin(status: InstallationStatus | undefined, page: number, pageSize: number) {
    const where = status ? { status } : {};
    return Promise.all([
      this.prisma.installationRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.installationRequest.count({ where }),
    ]);
  }

  async updateStatusForAdmin(id: string, status: InstallationStatus) {
    const existing = await this.prisma.installationRequest.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new AppError(404, "INSTALLATION_REQUEST_NOT_FOUND", "The request was not found.");
    return this.prisma.installationRequest.update({ where: { id }, data: { status } });
  }
}
