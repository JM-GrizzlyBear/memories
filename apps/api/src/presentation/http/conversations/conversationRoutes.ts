import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  uploadMessagePhotos,
  uploadProfilePhoto,
} from "../middleware/uploadPhotos.js";
import type { ConversationController } from "./ConversationController.js";

export function createConversationRouter(controller: ConversationController) {
  const router = Router();
  // Check the login BEFORE reading any uploaded files
  router.use(requireAuth);

  // Fixed paths first, so they're not read as a chat id
  router.get("/", controller.list);
  router.get("/counts", controller.counts);
  router.get("/people", controller.people);
  router.post("/direct", controller.direct);
  router.post("/groups", controller.createGroup);

  router.get("/:id", controller.get);
  router.patch("/:id", controller.rename);
  router.put("/:id/photo", uploadProfilePhoto, controller.setPhoto);
  router.delete("/:id/photo", controller.removePhoto);

  router.get("/:id/messages", controller.messages);
  router.post("/:id/messages", uploadMessagePhotos, controller.sendMessage);
  router.patch("/:id/messages/:messageId", controller.editMessage);
  router.delete("/:id/messages/:messageId", controller.unsendMessage);

  router.post("/:id/read", controller.read);
  router.post("/:id/accept", controller.accept);
  router.post("/:id/decline", controller.decline);
  router.put("/:id/archive", controller.archive);
  router.delete("/:id/archive", controller.unarchive);

  router.post("/:id/members", controller.addMembers);
  router.delete("/:id/members/:userId", controller.removeMember);
  router.put("/:id/members/:userId/role", controller.setRole);

  return router;
}
