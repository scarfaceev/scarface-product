import { Router } from "express";
import type { RequestHandler } from "express";
import { AppError } from "../../utils/app-error.js";

export function healthRouter(checkDatabase: () => Promise<void>): Router {
  const router = Router();
  const health: RequestHandler = async (_req, res) => {
    try {
      await checkDatabase();
      res.json({ status: "ok", database: "connected" });
    } catch {
      throw new AppError(503, "DEPENDENCY_UNAVAILABLE", "A required service is unavailable.");
    }
  };
  router.get("/", health);
  return router;
}
