import { useCallback, useEffect, useState } from "react";
import type { Comment } from "../../domain/comment";
import {
  addComment,
  deleteComment,
  listComments,
} from "../../infrastructure/api/commentApi";

type Status = "loading" | "ready" | "error";

export function useComments(memoryId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const load = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      try {
        const loaded = await listComments(memoryId);
        if (isCancelled()) return;
        setComments(loaded);
        setStatus("ready");
      } catch {
        if (!isCancelled()) setStatus("error");
      }
    },
    [memoryId],
  );

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  function retry() {
    setStatus("loading");
    load();
  }

  // Errors are thrown back to the form, which shows them next to the field
  async function add(body: string) {
    const comment = await addComment(memoryId, body);
    setComments((current) => [...current, comment]);
  }

  async function remove(commentId: string) {
    await deleteComment(memoryId, commentId);
    setComments((current) => current.filter((c) => c.id !== commentId));
  }

  return { comments, status, retry, add, remove };
}
