import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  errorFormat: "minimal",
});

export async function checkDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Database connection closed");
}
