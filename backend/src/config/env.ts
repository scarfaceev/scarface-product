import "dotenv/config";
import { z } from "zod";

function isLoopbackUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
  } catch {
    return false;
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isDatabaseUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}

const booleanFromEnv = z.preprocess(
  (value) => typeof value === "string" ? value.toLowerCase() === "true" : value,
  z.boolean(),
);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z.string().min(1).refine(isDatabaseUrl, "Must be a valid PostgreSQL connection URL.")
    .default("postgresql://postgres:postgres@localhost:5432/scarfaceev?schema=public"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  BACKEND_URL: z.string().url().default("http://localhost:3001"),
  CORS_ORIGINS: z.string().default("")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  MICROSOFT_CLIENT_ID: z.string().optional().default(""),
  MICROSOFT_CLIENT_SECRET: z.string().optional().default(""),
  MICROSOFT_TENANT_ID: z.string().min(1).default("consumers"),
  APPLE_CLIENT_ID: z.string().optional().default(""),
  APPLE_TEAM_ID: z.string().optional().default(""),
  APPLE_KEY_ID: z.string().optional().default(""),
  APPLE_PRIVATE_KEY: z.string().optional().default(""),
  GITHUB_CLIENT_ID: z.string().optional().default(""),
  GITHUB_CLIENT_SECRET: z.string().optional().default(""),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  EMAIL_PROVIDER: z.enum(["disabled", "resend"]).default("disabled"),
  EMAIL_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default(""),
  ENQUIRY_RECEIVER_EMAIL: z.string().email().or(z.literal("")).default(""),
  COMPANY_NOTIFICATION_EMAIL: z.string().email().or(z.literal("")).default(""),
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
  if (value.NODE_ENV === "production") {
    if (isLoopbackUrl(value.DATABASE_URL)) {
      context.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "A production database URL is required." });
    }
    if (isLoopbackUrl(value.FRONTEND_URL)) {
      context.addIssue({ code: "custom", path: ["FRONTEND_URL"], message: "A public frontend origin is required in production." });
    }
    if (isLoopbackUrl(value.BACKEND_URL)) {
      context.addIssue({ code: "custom", path: ["BACKEND_URL"], message: "A public backend origin is required in production." });
    }
    if (!isHttpsUrl(value.FRONTEND_URL)) {
      context.addIssue({ code: "custom", path: ["FRONTEND_URL"], message: "Use HTTPS for the production frontend origin." });
    }
    if (!isHttpsUrl(value.BACKEND_URL)) {
      context.addIssue({ code: "custom", path: ["BACKEND_URL"], message: "Use HTTPS for the production backend origin." });
    }
    if (value.STORAGE_PROVIDER !== "s3") {
      context.addIssue({ code: "custom", path: ["STORAGE_PROVIDER"], message: "Use durable S3-compatible storage in production." });
    }
  }
  if (value.EMAIL_PROVIDER === "resend") {
    if (!value.EMAIL_API_KEY) context.addIssue({ code: "custom", path: ["EMAIL_API_KEY"], message: "Required when EMAIL_PROVIDER=resend." });
    if (!value.EMAIL_FROM) context.addIssue({ code: "custom", path: ["EMAIL_FROM"], message: "Required when EMAIL_PROVIDER=resend." });
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
