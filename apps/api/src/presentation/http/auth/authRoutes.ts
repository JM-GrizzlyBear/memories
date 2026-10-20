import { Router, type RequestHandler } from "express";
import type { AuthController } from "./AuthController.js";
import type { PasswordResetController } from "./PasswordResetController.js";

export function createAuthRouter(
  controller: AuthController,
  passwordReset: PasswordResetController,
  limits: { forgotPassword: RequestHandler; resetPassword: RequestHandler },
) {
  const router = Router();
  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.get("/me", controller.me);
  router.post("/logout", controller.logout);

  // Forgot password
  router.get("/password-reset", passwordReset.status);
  router.post("/forgot-password", limits.forgotPassword, passwordReset.forgot);
  router.post(
    "/reset-password/check",
    limits.resetPassword,
    passwordReset.check,
  );
  router.post("/reset-password", limits.resetPassword, passwordReset.reset);
  return router;
}
