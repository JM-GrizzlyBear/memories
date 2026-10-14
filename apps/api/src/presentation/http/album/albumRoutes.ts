import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import type { AlbumController } from "./AlbumController.js";

export function createAlbumRouter(controller: AlbumController) {
  const router = Router();
  router.use(requireAuth);

  router.put("/notes/:year", controller.saveNote);
  router.get("/:username", controller.show);

  return router;
}
