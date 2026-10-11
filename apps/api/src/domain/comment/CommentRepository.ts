import type { Comment, CommentWithMemoryOwner } from "./Comment.js";

export interface NewComment {
  memoryId: string;
  userId: string;
  body: string;
}

export interface CommentRepository {
  create(comment: NewComment): Promise<Comment>;
  // Oldest first, so a conversation reads top to bottom
  listForMemory(memoryId: string, limit: number): Promise<Comment[]>;
  findById(id: string): Promise<CommentWithMemoryOwner | null>;
  delete(id: string): Promise<void>;
}
