import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { waitUntil } from "@vercel/functions";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/database/prisma.js";
import { createEmailProvider } from "../src/modules/notifications/email-provider.js";
import { NotificationWorker } from "../src/modules/notifications/notification.service.js";

const app = createApp();
const notificationWorker = new NotificationWorker(prisma, createEmailProvider());
const notificationRoutes = new Set([
  "/api/v1/enquiries",
  "/api/v1/installation-requests",
  "/api/v1/jobs/applications",
]);

function getPathname(request: IncomingMessage): string {
  return new URL(request.url ?? "/", "http://vercel.local").pathname.replace(/\/+$/, "") || "/";
}

function isAuthorizedCron(request: IncomingMessage): boolean {
  const authorization = request.headers.authorization;
  const supplied = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expectedBuffer = Buffer.from(env.CRON_SECRET);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length >= 32 &&
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function sendJson(response: ServerResponse, statusCode: number, body: object): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

export const config = { maxDuration: 300 };

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const pathname = getPathname(request);
  if (pathname === "/api/cron/notifications") {
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }
    if (!isAuthorizedCron(request)) {
      sendJson(response, 401, { error: "Unauthorized." });
      return;
    }
    const processed = await notificationWorker.processBatch();
    sendJson(response, processed ? 200 : 503, { processed });
    return;
  }

  if (request.method === "POST" && notificationRoutes.has(pathname)) {
    const processAfterResponse = new Promise<boolean>((resolve) => {
      response.once("finish", () => resolve(response.statusCode < 400));
    }).then((successful) => successful ? notificationWorker.processBatch(1) : true);
    waitUntil(processAfterResponse);
  }

  app(request, response);
}
