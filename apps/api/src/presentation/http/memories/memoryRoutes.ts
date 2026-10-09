import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadPhotos } from "../middleware/uploadPhotos.js";
import type { MemoryController } from "./MemoryController.js";

export function createMemoryRouter(controller: MemoryController) {
  const router = Router();

  // Order matters: check login BEFORE reading any uploaded files
  router.get("/", requireAuth, controller.list);
  router.post("/", requireAuth, uploadPhotos, controller.create);
  router.get("/:id", requireAuth, controller.get);
  router.patch("/:id", requireAuth, uploadPhotos, controller.update);
  router.delete("/:id", requireAuth, controller.remove);

  return router;
}
