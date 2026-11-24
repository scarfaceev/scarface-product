import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { disconnectDatabase, prisma } from "./database/prisma.js";
import { createEmailProvider } from "./modules/notifications/email-provider.js";
import { NotificationWorker } from "./modules/notifications/notification.service.js";

const app = createApp();
const server = createServer(app);
const worker = new NotificationWorker(prisma, createEmailProvider());

async function start(): Promise<void> {
  await prisma.$connect();
  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, environment: env.NODE_ENV }, "ScarfaceEV backend listening");
  });
  worker.start(env.EMAIL_POLL_INTERVAL_MS);
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down backend");
  worker.stop();
  server.close(async (error) => {
    if (error) logger.error({ err: error }, "HTTP server close failed");
    await disconnectDatabase();
    process.exitCode = error ? 1 : 0;
  });
}

process.once("SIGINT", () => { void shutdown("SIGINT"); });
process.once("SIGTERM", () => { void shutdown("SIGTERM"); });

start().catch(async (error: unknown) => {
  logger.fatal({ err: error }, "Backend failed to start");
  await disconnectDatabase();
  process.exitCode = 1;
});
