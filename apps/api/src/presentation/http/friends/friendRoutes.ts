import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import type { FriendController } from "./FriendController.js";

export function createFriendRouter(controller: FriendController) {
  const router = Router();
  router.use(requireAuth); // every friends route needs a login

  router.get("/", controller.list);
  router.get("/requests", controller.requests);
  router.post("/requests/:userId", controller.send);
  router.delete("/requests/:userId", controller.cancel);
  router.post("/requests/:userId/accept", controller.accept);
  router.post("/requests/:userId/decline", controller.decline);
  router.delete("/:userId", controller.remove);

  return router;
}
