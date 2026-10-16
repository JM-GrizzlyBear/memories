import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadProfilePhoto } from "../middleware/uploadPhotos.js";
import type { AccountController } from "./AccountController.js";

export function createAccountRouter(controller: AccountController) {
  const router = Router();
  router.use(requireAuth);

  router.patch("/profile", controller.editProfile);
  router.put("/password", controller.updatePassword);
  router.put("/photo", uploadProfilePhoto, controller.uploadPhoto);
  router.delete("/photo", controller.deletePhoto);
  router.put("/privacy", controller.updatePrivacy);

  return router;
}
