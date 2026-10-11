import type { CommentRepository } from "../../domain/comment/CommentRepository.js";
import {
  CommentNotFoundError,
  NotAllowedToDeleteCommentError,
} from "../../domain/comment/errors.js";
import { canDeleteComment } from "../../domain/comment/rules.js";
import type { MemoryAccess } from "../memory/MemoryAccess.js";

export interface DeleteCommentInput {
  memoryId: string;
  commentId: string;
  viewerId: string;
}

export class DeleteComment {
  constructor(
    private readonly access: MemoryAccess,
    private readonly comments: CommentRepository,
  ) {}

  async execute({ memoryId, commentId, viewerId }: DeleteCommentInput) {
    // Can't see the memory = can't see (or touch) its comments
    await this.access.findViewable(memoryId, viewerId);

    const comment = await this.comments.findById(commentId);
    if (!comment || comment.memoryId !== memoryId) {
      throw new CommentNotFoundError();
    }
    if (!canDeleteComment(comment, viewerId)) {
      throw new NotAllowedToDeleteCommentError();
    }

    await this.comments.delete(commentId);
  }
}
