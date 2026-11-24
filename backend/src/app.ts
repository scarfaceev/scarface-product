import cors from "cors";
import express from "express";
import type { Express } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { checkDatabase } from "./database/prisma.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { apiV1Router } from "./routes/api-v1.js";
import { services as defaultServices } from "./services/container.js";
import type { AppDependencies } from "./app-types.js";
import { AppError } from "./utils/app-error.js";
import { openApiDocument } from "./openapi/document.js";

export function createApp(dependencies: AppDependencies = {}): Express {
  const services = dependencies.services ?? defaultServices;
  const databaseCheck = dependencies.checkDatabase ?? checkDatabase;
  const app = express();
  const allowedOrigins = new Set([env.FRONTEND_URL, ...env.CORS_ORIGINS]);

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed."));
    },
  }));
  app.use(express.json({ limit: env.MAX_JSON_BODY, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: env.MAX_JSON_BODY, parameterLimit: 100 }));
  app.use(pinoHttp({ logger }));
  app.use(rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: Math.max(env.RATE_LIMIT_MAX * 10, 300),
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));

  app.use("/api/v1", apiV1Router(services, databaseCheck));

  if (env.NODE_ENV !== "production") {
    app.get("/api/openapi.json", (_req, res) => res.json(openApiDocument));
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
