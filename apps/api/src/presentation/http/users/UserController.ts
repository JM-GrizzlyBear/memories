import type { Request, Response } from "express";
import { z } from "zod";
import type { GetProfile } from "../../../application/user/GetProfile.js";
import type { SearchUsers } from "../../../application/user/SearchUsers.js";
import { UserNotFoundError } from "../../../domain/user/errors.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Type at least 2 characters").max(50),
});

export class UserController {
  constructor(
    private readonly searchUsers: SearchUsers,
    private readonly getProfile: GetProfile,
  ) {}

  /** GET /api/users?q=maria → 200 { users } | 400 */
  search = async (req: Request, res: Response) => {
    const query = searchQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ errors: z.flattenError(query.error).fieldErrors });
      return;
    }

    const users = await this.searchUsers.execute({
      viewerId: req.session.userId as string,
      text: query.data.q,
    });
    res.status(200).json({ users });
  };

  /** GET /api/users/:username → 200 { profile } | 404 */
  profile = async (req: Request, res: Response) => {
    const username = String(req.params.username ?? "");
    if (!username || username.length > 25) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    try {
      const profile = await this.getProfile.execute({
        viewerId: req.session.userId as string,
        username,
      });
      res.status(200).json({ profile });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      throw error;
    }
  };
}
