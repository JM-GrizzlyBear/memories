import type { CommentRepository } from "../../domain/comment/CommentRepository.js";
import type { MemoryAccess } from "../memory/MemoryAccess.js";

export interface AddCommentInput {
  memoryId: string;
  viewerId: string;
  body: string; // already trimmed and checked by createCommentSchema
}

export class AddComment {
  constructor(
    private readonly access: MemoryAccess,
    private readonly comments: CommentRepository,
  ) {}

  async execute({ memoryId, viewerId, body }: AddCommentInput) {
    await this.access.findViewable(memoryId, viewerId);
    return this.comments.create({ memoryId, userId: viewerId, body });
  }
}
