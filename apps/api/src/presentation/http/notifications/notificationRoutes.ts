import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import type { NotificationController } from "./NotificationController.js";

export function createNotificationRouter(controller: NotificationController) {
  const router = Router();
  router.use(requireAuth);

  router.get("/", controller.list);
  router.get("/unread-count", controller.unreadCount);
  router.post("/read-all", controller.markAllRead);
  router.post("/:id/read", controller.markRead);

  return router;
}
