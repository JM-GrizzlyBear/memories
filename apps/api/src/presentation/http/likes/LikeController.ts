import type { Request, Response } from "express";
import type { LikeMemory } from "../../../application/like/LikeMemory.js";
import { MemoryNotFoundError } from "../../../domain/memory/errors.js";
import { parseId } from "../parseId.js";

export class LikeController {
  constructor(private readonly likeMemory: LikeMemory) {}

  private async setLiked(req: Request, res: Response, liked: boolean) {
    const memoryId = parseId(req.params.id);
    if (!memoryId) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    try {
      const result = await this.likeMemory.execute({
        memoryId,
        viewerId: req.session.userId as string,
        liked,
      });
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof MemoryNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      throw error;
    }
  }

  /** PUT /api/memories/:id/like → 200 { likedByMe, likeCount } | 404 */
  like = (req: Request, res: Response) => this.setLiked(req, res, true);

  /** DELETE /api/memories/:id/like → 200 { likedByMe, likeCount } | 404 */
  unlike = (req: Request, res: Response) => this.setLiked(req, res, false);
}
