import type { RequestHandler } from "express";
import { mediaIdSchema } from "./media.schemas.js";
import type { MediaService } from "./media.service.js";

export function createMediaController(service: Pick<MediaService, "getPublicAsset">) {
  const getPublic: RequestHandler = async (req, res) => {
    const id = mediaIdSchema.parse(req.params.id);
    const asset = await service.getPublicAsset(id);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("Cache-Control", "public, max-age=3600, immutable");
    res.type(asset.mimeType);
    res.setHeader(
      "Content-Disposition",
      asset.mimeType.startsWith("image/") ? "inline" : `attachment; filename="${encodeURIComponent(asset.originalName)}"`,
    );
    res.send(asset.data);
  };
  return { getPublic };
}
