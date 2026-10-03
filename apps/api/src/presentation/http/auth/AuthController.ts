import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { LoginUser } from "../../../application/user/LoginUser.js";
import type { RegisterUser } from "../../../application/user/RegisterUser.js";
import {
  EmailAlreadyTakenError,
  InvalidCredentialsError,
  UsernameAlreadyTakenError,
} from "../../../domain/user/errors.js";
import { loginSchema } from "./loginSchema.js";
import { registerSchema } from "./registerSchema.js";

/**
 * Replaces the current session with a brand-new one (new session id).
 * Protects against session fixation: an attacker can't plant a known
 * session id before login and reuse it after the user logs in.
 * express-session uses callbacks, so we wrap it in a Promise to `await` it.
 */
function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
  ) {}

  register = async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }

    try {
      const user = await this.registerUser.execute(parsed.data);
      res.status(201).json({ user });
    } catch (error) {
      if (error instanceof EmailAlreadyTakenError) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error instanceof UsernameAlreadyTakenError) {
        res.status(409).json({ error: error.message });
        return;
      }

      throw error;
    }
  };

  login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }

    try {
      const user = await this.loginUser.execute(parsed.data);

      // Start a fresh session, THEN store who is logged in.
      // express-session saves it to Postgres and sends the cookie automatically.
      await regenerateSession(req);
      req.session.userId = user.id;

      res.status(200).json({ user });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({ error: error.message });
        return;
      }
      throw error;
    }
  };

  logout = (req: Request, res: Response, next: NextFunction) => {
    // Deletes the session from Postgres, so the old cookie becomes useless
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("memories.sid"); // tell the browser to delete the cookie
      res.status(204).end();
    });
  };
}
