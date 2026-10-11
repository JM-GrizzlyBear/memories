import { changePasswordSchema, updateProfileSchema } from "@memories/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import type { ChangePassword } from "../../../application/user/ChangePassword.js";
import type { RemoveProfilePhoto } from "../../../application/user/RemoveProfilePhoto.js";
import type { SetProfilePhoto } from "../../../application/user/SetProfilePhoto.js";
import type { UpdateProfile } from "../../../application/user/UpdateProfile.js";
import {
  IncorrectPasswordError,
  UsernameAlreadyTakenError,
  UserNotFoundError,
} from "../../../domain/user/errors.js";
import { regenerateSession } from "../session.js";

// Everything here is about the logged-in user's own account (requireAuth runs first)
export class AccountController {
  constructor(
    private readonly updateProfile: UpdateProfile,
    private readonly changePassword: ChangePassword,
    private readonly setProfilePhoto: SetProfilePhoto,
    private readonly removeProfilePhoto: RemoveProfilePhoto,
  ) {}

  /** PATCH /api/account/profile → 200 { user } | 400 | 409 */
  editProfile = async (req: Request, res: Response) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }

    try {
      const user = await this.updateProfile.execute({
        userId: req.session.userId as string,
        ...parsed.data,
      });
      res.status(200).json({ user });
    } catch (error) {
      if (error instanceof UsernameAlreadyTakenError) {
        // Shown under the username field
        res.status(409).json({
          error: error.message,
          errors: { username: [error.message] },
        });
        return;
      }
      if (this.sendIfAccountGone(error, res)) return;
      throw error;
    }
  };

  /** PUT /api/account/password → 204 | 400 */
  updatePassword = async (req: Request, res: Response) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }

    const userId = req.session.userId as string;
    try {
      await this.changePassword.execute({
        userId,
        sessionId: req.sessionID,
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
    } catch (error) {
      if (error instanceof IncorrectPasswordError) {
        res.status(400).json({
          error: error.message,
          errors: { currentPassword: [error.message] },
        });
        return;
      }
      if (this.sendIfAccountGone(error, res)) return;
      throw error;
    }

    // Stay logged in here, with a fresh session id
    await regenerateSession(req);
    req.session.userId = userId;
    res.status(204).end();
  };

  /** PUT /api/account/photo (multipart, field "photo") → 200 { user } | 400 */
  uploadPhoto = async (req: Request, res: Response) => {
    const [file] = (req.files ?? []) as Express.Multer.File[];
    if (!file) {
      res.status(400).json({ errors: { photo: ["Choose a photo"] } });
      return;
    }

    try {
      const user = await this.setProfilePhoto.execute({
        userId: req.session.userId as string,
        photo: { data: file.buffer, mimeType: file.mimetype },
      });
      res.status(200).json({ user });
    } catch (error) {
      if (this.sendIfAccountGone(error, res)) return;
      throw error;
    }
  };

  /** DELETE /api/account/photo → 200 { user } */
  deletePhoto = async (req: Request, res: Response) => {
    try {
      const user = await this.removeProfilePhoto.execute(
        req.session.userId as string,
      );
      res.status(200).json({ user });
    } catch (error) {
      if (this.sendIfAccountGone(error, res)) return;
      throw error;
    }
  };

  // The session points to an account that no longer exists
  private sendIfAccountGone(error: unknown, res: Response) {
    if (!(error instanceof UserNotFoundError)) return false;
    res.status(401).json({ error: "Not logged in" });
    return true;
  }
}
