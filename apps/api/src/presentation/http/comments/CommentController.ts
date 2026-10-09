import { createCommentSchema } from "@memories/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import type { AddComment } from "../../../application/comment/AddComment.js";
import type { DeleteComment } from "../../../application/comment/DeleteComment.js";
import type { ListComments } from "../../../application/comment/ListComments.js";
import {
  CommentNotFoundError,
  NotAllowedToDeleteCommentError,
} from "../../../domain/comment/errors.js";
import { MemoryNotFoundError } from "../../../domain/memory/errors.js";
import { parseId } from "../parseId.js";

function sendKnownError(res: Response, error: unknown) {
  if (
    error instanceof MemoryNotFoundError ||
    error instanceof CommentNotFoundError
  ) {
    res.status(404).json({ error: error.message });
    return true;
  }
  if (error instanceof NotAllowedToDeleteCommentError) {
    res.status(403).json({ error: error.message });
    return true;
  }
  return false;
}

export class CommentController {
  constructor(
    private readonly listComments: ListComments,
    private readonly addComment: AddComment,
    private readonly deleteComment: DeleteComment,
  ) {}

  /** GET /api/memories/:id/comments → 200 { comments } | 404 */
  list = async (req: Request, res: Response) => {
    const memoryId = parseId(req.params.id);
    if (!memoryId) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    try {
      const comments = await this.listComments.execute({
        memoryId,
        viewerId: req.session.userId as string,
      });
      res.status(200).json({ comments });
    } catch (error) {
      if (!sendKnownError(res, error)) throw error;
    }
  };

  /** POST /api/memories/:id/comments { body } → 201 { comment } | 400 | 404 */
  create = async (req: Request, res: Response) => {
    const memoryId = parseId(req.params.id);
    if (!memoryId) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    const parsed = createCommentSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }

    try {
      const comment = await this.addComment.execute({
        memoryId,
        viewerId: req.session.userId as string,
        body: parsed.data.body,
      });
      res.status(201).json({ comment });
    } catch (error) {
      if (!sendKnownError(res, error)) throw error;
    }
  };

  /** DELETE /api/memories/:id/comments/:commentId → 204 | 403 | 404 */
  remove = async (req: Request, res: Response) => {
    const memoryId = parseId(req.params.id);
    const commentId = parseId(req.params.commentId);
    if (!memoryId || !commentId) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    try {
      await this.deleteComment.execute({
        memoryId,
        commentId,
        viewerId: req.session.userId as string,
      });
      res.status(204).end();
    } catch (error) {
      if (!sendKnownError(res, error)) throw error;
    }
  };
}
