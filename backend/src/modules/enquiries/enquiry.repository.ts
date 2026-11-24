import type { EnquiryStatus, PrismaClient } from "@prisma/client";
import type { CreateEnquiryInput } from "./enquiry.schema.js";

export class EnquiryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: CreateEnquiryInput) {
    return this.prisma.enquiry.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone ?? null,
        interest: input.interest,
        message: input.message,
      },
    });
  }

  list(status: EnquiryStatus | undefined, page: number, pageSize: number) {
    const where = status ? { status } : {};
    return Promise.all([
      this.prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.enquiry.count({ where }),
    ]);
  }

  updateStatus(id: string, status: EnquiryStatus) {
    return this.prisma.enquiry.update({
      where: { id },
      data: {
        status,
        resolvedAt: ["RESPONDED", "CLOSED"].includes(status) ? new Date() : null,
      },
    });
  }
}
