import type { EnquiryStatus, PrismaClient } from "@prisma/client";
import { env } from "../../config/env.js";
import { NotificationService } from "../notifications/notification.service.js";
import { EnquiryRepository } from "./enquiry.repository.js";
import type { CreateEnquiryInput } from "./enquiry.schema.js";

export class EnquiryService {
  private readonly repository: EnquiryRepository;

  constructor(private readonly prisma: PrismaClient, private readonly notifications: NotificationService) {
    this.repository = new EnquiryRepository(prisma);
  }

  async create(input: CreateEnquiryInput) {
    return this.prisma.$transaction(async (transaction) => {
      const enquiry = await transaction.enquiry.create({
        data: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone ?? null,
          interest: input.interest,
          message: input.message,
        },
      });

      await this.notifications.enqueueCompanyNotification(
        transaction,
        "ENQUIRY_ADMIN",
        { enquiryId: enquiry.id },
        enquiry.id,
      );
      if (env.SEND_CUSTOMER_ACK) {
        await this.notifications.enqueueCustomerAcknowledgement(
          transaction,
          "ENQUIRY_ACK",
          enquiry.email,
          { enquiryId: enquiry.id },
          enquiry.id,
        );
      }

      return enquiry;
    });
  }

  listForAdmin(status: EnquiryStatus | undefined, page: number, pageSize: number) {
    return this.repository.list(status, page, pageSize);
  }

  updateStatusForAdmin(id: string, status: EnquiryStatus) {
    return this.repository.updateStatus(id, status);
  }
}
