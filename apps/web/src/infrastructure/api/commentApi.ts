import type { Comment } from "../../domain/comment";
import { request } from "./http";

function commentsPath(memoryId: string) {
  return `/memories/${encodeURIComponent(memoryId)}/comments`;
}

export async function listComments(memoryId: string): Promise<Comment[]> {
  const data = await request<{ comments: Comment[] }>(commentsPath(memoryId));
  return data.comments;
}

export async function addComment(
  memoryId: string,
  body: string,
): Promise<Comment> {
  const data = await request<{ comment: Comment }>(commentsPath(memoryId), {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return data.comment;
}

export async function deleteComment(
  memoryId: string,
  commentId: string,
): Promise<void> {
  await request<void>(
    `${commentsPath(memoryId)}/${encodeURIComponent(commentId)}`,
    { method: "DELETE" },
  );
}
