import {
  checkResetLinkSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@memories/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import type { CheckPasswordResetLink } from "../../../application/user/CheckPasswordResetLink.js";
import type { RequestPasswordReset } from "../../../application/user/RequestPasswordReset.js";
import type { ResetPassword } from "../../../application/user/ResetPassword.js";
import {
  InvalidResetLinkError,
  PasswordResetUnavailableError,
} from "../../../domain/passwordReset/errors.js";

// Forgot password → email with a link → choose a new password
export class PasswordResetController {
  constructor(
    private readonly requestPasswordReset: RequestPasswordReset,
    private readonly checkPasswordResetLink: CheckPasswordResetLink,
    private readonly resetPassword: ResetPassword,
    // false on a server that can't send email (the live site on free hosting)
    private readonly available: boolean,
  ) {}

  /** GET /api/auth/password-reset → 200 { available } */
  status = (_req: Request, res: Response) => {
    res.status(200).json({ available: this.available });
  };

  /** POST /api/auth/forgot-password → 202 | 400 | 429 | 503 */
  forgot = async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }
    try {
      await this.requestPasswordReset.execute(parsed.data.email);
      // The same answer whether or not the email has an account
      res.status(202).json({ ok: true });
    } catch (error) {
      if (error instanceof PasswordResetUnavailableError) {
        res.status(503).json({ error: error.message, code: "unavailable" });
        return;
      }
      throw error;
    }
  };

  /** POST /api/auth/reset-password/check → 200 { username, email } | 400 */
  check = async (req: Request, res: Response) => {
    const parsed = checkResetLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error: new InvalidResetLinkError().message,
          code: "invalid_link",
        });
      return;
    }
    try {
      const { user } = await this.checkPasswordResetLink.execute(
        parsed.data.token,
      );
      res.status(200).json({ username: user.username, email: user.email });
    } catch (error) {
      if (this.sendIfInvalidLink(error, res)) return;
      throw error;
    }
  };

  /** POST /api/auth/reset-password → 204 | 400 */
  reset = async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }
    try {
      await this.resetPassword.execute({
        token: parsed.data.token,
        newPassword: parsed.data.newPassword,
      });
      res.status(204).end();
    } catch (error) {
      if (this.sendIfInvalidLink(error, res)) return;
      throw error;
    }
  };

  private sendIfInvalidLink(error: unknown, res: Response) {
    if (!(error instanceof InvalidResetLinkError)) return false;
    res.status(400).json({ error: error.message, code: "invalid_link" });
    return true;
  }
}
