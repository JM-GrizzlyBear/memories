import type { CommentRepository } from "../../domain/comment/CommentRepository.js";
import type { MemoryAccess } from "../memory/MemoryAccess.js";
import type { Notifier } from "../notification/Notifier.js";

export interface AddCommentInput {
  memoryId: string;
  viewerId: string;
  body: string; // already trimmed and checked by createCommentSchema
}

export class AddComment {
  constructor(
    private readonly access: MemoryAccess,
    private readonly comments: CommentRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute({ memoryId, viewerId, body }: AddCommentInput) {
    const memory = await this.access.findViewable(memoryId, viewerId);
    const comment = await this.comments.create({
      memoryId,
      userId: viewerId,
      body,
    });

    await this.notifier.notify({
      recipientId: memory.userId,
      actorId: viewerId,
      type: "memory_commented",
      memoryId,
      commentId: comment.id,
    });
    return comment;
  }
}
