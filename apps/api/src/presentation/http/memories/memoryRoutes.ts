import { Router } from "express";
import type { CommentController } from "../comments/CommentController.js";
import type { LikeController } from "../likes/LikeController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadPhotos } from "../middleware/uploadPhotos.js";
import type { MemoryController } from "./MemoryController.js";

export function createMemoryRouter(
  controller: MemoryController,
  likes: LikeController,
  comments: CommentController,
) {
  const router = Router();

  // Order matters: check login BEFORE reading any uploaded files
  router.get("/", requireAuth, controller.list);
  router.post("/", requireAuth, uploadPhotos, controller.create);
  router.get("/:id", requireAuth, controller.get);
  router.patch("/:id", requireAuth, uploadPhotos, controller.update);
  router.delete("/:id", requireAuth, controller.remove);

  // Likes: PUT and DELETE are safe to repeat
  router.put("/:id/like", requireAuth, likes.like);
  router.delete("/:id/like", requireAuth, likes.unlike);

  // Comments
  router.get("/:id/comments", requireAuth, comments.list);
  router.post("/:id/comments", requireAuth, comments.create);
  router.delete("/:id/comments/:commentId", requireAuth, comments.remove);

  return router;
}
