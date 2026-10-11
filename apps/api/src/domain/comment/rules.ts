import type { CommentWithMemoryOwner } from "./Comment.js";

// The person who wrote a comment can delete it, and so can the owner of the memory
export function canDeleteComment(
  comment: Pick<CommentWithMemoryOwner, "author" | "memoryOwnerId">,
  viewerId: string,
) {
  return comment.author.id === viewerId || comment.memoryOwnerId === viewerId;
}
