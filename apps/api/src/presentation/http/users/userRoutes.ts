import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import type { UserController } from "./UserController.js";

export function createUserRouter(controller: UserController) {
  const router = Router();
  router.use(requireAuth);

  router.get("/", controller.search);
  router.get("/:username", controller.profile);

  return router;
}
