import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadPhotos } from "../middleware/uploadPhotos.js";
import type { MemoryController } from "./MemoryController.js";

export function createMemoryRouter(controller: MemoryController) {
  const router = Router();

  // Order matters: check login BEFORE reading any uploaded files
  router.post("/", requireAuth, uploadPhotos, controller.create);

  return router;
}
