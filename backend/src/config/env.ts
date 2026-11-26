import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess(
  (value) => typeof value === "string" ? value.toLowerCase() === "true" : value,
  z.boolean(),
);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/scarfaceev?schema=public"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  CORS_ORIGINS: z.string().default("http://localhost:5173")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  SESSION_SECRET: z.string().min(32).default("development-only-change-this-session-secret"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  EMAIL_PROVIDER: z.enum(["disabled", "resend"]).default("disabled"),
  EMAIL_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default(""),
  COMPANY_NOTIFICATION_EMAIL: z.string().email().optional().or(z.literal("")).default(""),
  SEND_CUSTOMER_ACK: booleanFromEnv.default(false),
  EMAIL_POLL_INTERVAL_MS: z.coerce.number().int().min(1_000).max(300_000).default(5_000),
  EMAIL_MAX_RETRIES: z.coerce.number().int().min(1).max(20).default(5),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().min(1).default("./uploads"),
  STORAGE_BUCKET: z.string().optional().default(""),
  STORAGE_ACCESS_KEY: z.string().optional().default(""),
  STORAGE_SECRET_KEY: z.string().optional().default(""),
  STORAGE_REGION: z.string().optional().default(""),
  STORAGE_ENDPOINT: z.string().optional().default(""),
  STORAGE_FORCE_PATH_STYLE: booleanFromEnv.default(false),
  MAX_JSON_BODY: z.string().min(1).default("256kb"),
  MAX_RESUME_SIZE_BYTES: z.coerce.number().int().min(1_024).max(25_000_000).default(5_242_880),
  MAX_MEDIA_SIZE_BYTES: z.coerce.number().int().min(1_024).max(50_000_000).default(10_485_760),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(30),
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && value.SESSION_SECRET === "development-only-change-this-session-secret") {
    context.addIssue({ code: "custom", path: ["SESSION_SECRET"], message: "Must be a unique secret in production." });
  }
  if (value.EMAIL_PROVIDER === "resend") {
    if (!value.EMAIL_API_KEY) context.addIssue({ code: "custom", path: ["EMAIL_API_KEY"], message: "Required when EMAIL_PROVIDER=resend." });
    if (!value.EMAIL_FROM) context.addIssue({ code: "custom", path: ["EMAIL_FROM"], message: "Required when EMAIL_PROVIDER=resend." });
    if (!value.COMPANY_NOTIFICATION_EMAIL) context.addIssue({ code: "custom", path: ["COMPANY_NOTIFICATION_EMAIL"], message: "Required when EMAIL_PROVIDER=resend." });
  }
  if (value.STORAGE_PROVIDER === "s3") {
    if (!value.STORAGE_BUCKET) context.addIssue({ code: "custom", path: ["STORAGE_BUCKET"], message: "Required when STORAGE_PROVIDER=s3." });
    if (!value.STORAGE_REGION) context.addIssue({ code: "custom", path: ["STORAGE_REGION"], message: "Required when STORAGE_PROVIDER=s3." });
  }
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid backend environment configuration: ${details}`);
}

export const env = result.data;
