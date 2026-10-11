import type { UserSummary } from "../user/User.js";

export interface Comment {
  id: string;
  memoryId: string;
  body: string;
  createdAt: Date;
  author: UserSummary;
}

// A comment plus the owner of the memory it's on (needed to decide who may delete it)
export interface CommentWithMemoryOwner extends Comment {
  memoryOwnerId: string;
}
