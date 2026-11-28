import { env } from "../../config/env.js";
import type { Prisma, PrismaClient, NotificationType } from "@prisma/client";
import { logger } from "../../config/logger.js";

type Transaction = Prisma.TransactionClient;

export async function enqueueNotification(
  transaction: Transaction,
  input: {
    type: NotificationType;
    recipient: string;
    dedupeKey: string;
    enquiryId?: string;
    installationRequestId?: string;
    jobApplicationId?: string;
  },
): Promise<void> {
  await transaction.notificationOutbox.create({
    data: {
      type: input.type,
      recipient: input.recipient,
      dedupeKey: input.dedupeKey,
      enquiryId: input.enquiryId,
      installationRequestId: input.installationRequestId,
      jobApplicationId: input.jobApplicationId,
    },
  });
}

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  async enqueueCompanyNotification(
    transaction: Transaction,
    type: NotificationType,
    relation: { enquiryId?: string; installationRequestId?: string; jobApplicationId?: string },
    entityId: string,
  ): Promise<void> {
    const recipient = type === "ENQUIRY_ADMIN" ? env.ENQUIRY_RECEIVER_EMAIL : env.COMPANY_NOTIFICATION_EMAIL;
    if (!recipient) {
      logger.warn({ notificationType: type }, "Company notification skipped: no recipient is configured");
      return;
    }
    await enqueueNotification(transaction, {
      type,
      recipient,
      dedupeKey: `${type}:${entityId}:company`,
      ...relation,
    });
  }

  async enqueueCustomerAcknowledgement(
    transaction: Transaction,
    type: "ENQUIRY_ACK" | "JOB_APPLICATION_ACK",
    recipient: string,
    relation: { enquiryId?: string; jobApplicationId?: string },
    entityId: string,
  ): Promise<void> {
    if (!env.SEND_CUSTOMER_ACK) return;
    await enqueueNotification(transaction, {
      type,
      recipient,
      dedupeKey: `${type}:${entityId}:customer`,
      ...relation,
    });
  }
}

export class NotificationWorker {
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly provider: import("./email-provider.js").EmailProvider | null,
  ) {}

  start(intervalMs: number): void {
    if (!this.provider) {
      logger.warn("Email delivery is disabled; notification outbox records will remain pending");
      return;
    }
    if (this.timer) return;
    this.timer = setInterval(() => { void this.processBatch(); }, intervalMs);
    this.timer.unref();
    void this.processBatch();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async processBatch(): Promise<void> {
    if (!this.provider || this.running) return;
    this.running = true;
    try {
      await this.releaseStaleClaims();
      for (let index = 0; index < 10; index += 1) {
        const notification = await this.claimOne();
        if (!notification) break;
        await this.sendOne(notification);
      }
    } catch (error) {
      logger.error({ err: error }, "Notification worker batch failed");
    } finally {
      this.running = false;
    }
  }

  private async releaseStaleClaims(): Promise<void> {
    const staleBefore = new Date(Date.now() - 10 * 60_000);
    await this.prisma.notificationOutbox.updateMany({
      where: { status: "PROCESSING", lockedAt: { lt: staleBefore } },
      data: { status: "PENDING", lockedAt: null, nextRetryAt: new Date() },
    });
  }

  private async claimOne() {
    const candidate = await this.prisma.notificationOutbox.findFirst({
      where: { status: "PENDING", nextRetryAt: { lte: new Date() } },
      orderBy: [{ nextRetryAt: "asc" }, { createdAt: "asc" }],
    });
    if (!candidate) return null;

    const now = new Date();
    const claimed = await this.prisma.notificationOutbox.updateMany({
      where: { id: candidate.id, status: "PENDING", nextRetryAt: { lte: now } },
      data: { status: "PROCESSING", lockedAt: now },
    });
    if (claimed.count !== 1) return null;

    return this.prisma.notificationOutbox.findUnique({
      where: { id: candidate.id },
      include: { enquiry: true, installationRequest: true, jobApplication: { include: { job: true } } },
    });
  }

  private async sendOne(notification: NonNullable<Awaited<ReturnType<NotificationWorker["claimOne"]>>>): Promise<void> {
    if (!notification || !this.provider) return;
    try {
      const { renderNotification } = await import("./templates.js");
      const message = renderNotification(notification);
      const providerReference = await this.provider.send({
        to: notification.recipient,
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.replyTo ? { replyTo: message.replyTo } : {}),
      });
      await this.prisma.notificationOutbox.update({
        where: { id: notification.id },
        data: { status: "SENT", sentAt: new Date(), providerReference, lockedAt: null, lastError: null },
      });
    } catch (error) {
      const retryCount = notification.retryCount + 1;
      const exhausted = retryCount >= env.EMAIL_MAX_RETRIES;
      const backoffMs = Math.min(60 * 60_000, 30_000 * (2 ** Math.min(retryCount - 1, 7)));
      await this.prisma.notificationOutbox.update({
        where: { id: notification.id },
        data: {
          status: exhausted ? "FAILED" : "PENDING",
          retryCount,
          nextRetryAt: new Date(Date.now() + backoffMs),
          lockedAt: null,
          lastError: "Email delivery failed.",
        },
      });
      logger.error({ notificationId: notification.id, retryCount, exhausted, err: error }, "Email delivery failed");
    }
  }
}
