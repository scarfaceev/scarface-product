import path from "node:path";
import { env } from "../../config/env.js";
import { LocalStorageAdapter } from "./local-storage.js";
import { S3StorageAdapter } from "./s3-storage.js";
import type { StorageAdapter } from "./storage-adapter.js";

export function createStorageAdapter(): StorageAdapter {
  if (env.STORAGE_PROVIDER === "s3") return new S3StorageAdapter(env.STORAGE_BUCKET);
  return new LocalStorageAdapter(path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR));
}
