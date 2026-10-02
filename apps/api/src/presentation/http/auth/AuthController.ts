import type { Request, Response } from "express";
import { z } from "zod";
import type { RegisterUser } from "../../../application/user/RegisterUser.js";
import {
  EmailAlreadyTakenError,
  UsernameAlreadyTakenError,
} from "../../../domain/user/errors.js";
import { registerSchema } from "./RegisterSchema.js";

export class AuthController {
  constructor(private readonly registerUser: RegisterUser) {}

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
}
