import type { CommentRepository } from "../../domain/comment/CommentRepository.js";
import type { MemoryAccess } from "../memory/MemoryAccess.js";

const MAX_COMMENTS = 200;

export interface ListCommentsInput {
  memoryId: string;
  viewerId: string;
}

export class ListComments {
  constructor(
    private readonly access: MemoryAccess,
    private readonly comments: CommentRepository,
  ) {}

  async execute({ memoryId, viewerId }: ListCommentsInput) {
    await this.access.findViewable(memoryId, viewerId);
    return this.comments.listForMemory(memoryId, MAX_COMMENTS);
  }
}
