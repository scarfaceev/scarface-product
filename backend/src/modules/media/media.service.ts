import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import type { PrismaClient } from "@prisma/client";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { StorageAdapter } from "./storage-adapter.js";

const publicImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const publicDocumentMimeTypes = new Set(["application/pdf"]);
const resumeMimeTypes = new Set(["application/pdf"]);
const extensionForMime = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

export interface IncomingFile {
  originalName: string;
  buffer: Buffer;
}

export class MediaService {
  constructor(private readonly prisma: PrismaClient, private readonly storage: StorageAdapter) {}

  async storePublicMedia(file: IncomingFile) {
    return this.store(file, "IMAGE", "PUBLIC", publicImageMimeTypes, env.MAX_MEDIA_SIZE_BYTES);
  }

  async storePublicDocument(file: IncomingFile) {
    return this.store(file, "DOCUMENT", "PUBLIC", publicDocumentMimeTypes, env.MAX_MEDIA_SIZE_BYTES);
  }

  async storePrivateResume(file: IncomingFile) {
    return this.store(file, "RESUME", "PRIVATE", resumeMimeTypes, env.MAX_RESUME_SIZE_BYTES);
  }

  private async store(
    file: IncomingFile,
    kind: "IMAGE" | "DOCUMENT" | "RESUME",
    visibility: "PUBLIC" | "PRIVATE",
    allowedTypes: Set<string>,
    maxBytes: number,
  ) {
    if (file.buffer.byteLength === 0 || file.buffer.byteLength > maxBytes) {
      throw new AppError(413, "FILE_SIZE_INVALID", "The file is empty or exceeds the allowed size.");
    }

    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !allowedTypes.has(detected.mime)) {
      throw new AppError(400, "FILE_TYPE_INVALID", "The uploaded file type is not allowed.");
    }

    const extension = extensionForMime.get(detected.mime);
    if (!extension) throw new AppError(400, "FILE_TYPE_INVALID", "The uploaded file type is not allowed.");

    const storageKey = `${visibility.toLowerCase()}/${randomUUID()}.${extension}`;
    const originalName = path.basename(file.originalName).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 255) || `upload.${extension}`;
    const sha256 = createHash("sha256").update(file.buffer).digest("hex");

    await this.storage.put(storageKey, file.buffer, detected.mime);
    try {
      return await this.prisma.mediaAsset.create({
        data: {
          storageKey,
          originalName,
          mimeType: detected.mime,
          sizeBytes: file.buffer.byteLength,
          sha256,
          kind,
          visibility,
        },
      });
    } catch (error) {
      await this.storage.delete(storageKey);
      throw error;
    }
  }

  async getPublicAsset(id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, visibility: "PUBLIC" },
      select: { id: true, storageKey: true, mimeType: true, originalName: true },
    });
    if (!asset) throw new AppError(404, "MEDIA_NOT_FOUND", "The requested media was not found.");
    return { ...asset, data: await this.storage.get(asset.storageKey) };
  }

  async getPrivateAsset(id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, visibility: "PRIVATE" },
      select: { id: true, storageKey: true, mimeType: true, originalName: true },
    });
    if (!asset) throw new AppError(404, "MEDIA_NOT_FOUND", "The requested media was not found.");
    return { ...asset, data: await this.storage.get(asset.storageKey) };
  }

  async deleteUnattachedAsset(id: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return;
    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.storage.delete(asset.storageKey);
  }
}
