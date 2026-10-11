import { useCallback, useEffect, useState } from "react";
import type { Memory } from "../../domain/memory";
import { listJournal } from "../../infrastructure/api/memoryApi";

type Status = "loading" | "ready" | "error";

// Loads the journal page by page, and keeps track of loading and errors.
// With an authorId, only that person's memories (for their profile).
export function useJournal(authorId: string | null = null) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  const loadFirstPage = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      try {
        const page = await listJournal(null, authorId);
        if (isCancelled()) return;
        setMemories(page.memories);
        setNextCursor(page.nextCursor);
        setStatus("ready");
      } catch {
        if (!isCancelled()) setStatus("error");
      }
    },
    [authorId],
  );

  useEffect(() => {
    // If the page closes before the answer arrives, ignore the answer
    let cancelled = false;
    loadFirstPage(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadFirstPage]);

  function retry() {
    setStatus("loading");
    loadFirstPage();
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const page = await listJournal(nextCursor, authorId);
      setMemories((current) => [...current, ...page.memories]);
      setNextCursor(page.nextCursor);
    } catch {
      setLoadMoreFailed(true);
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Put a just-kept memory at the top, without reloading (and never twice)
  const prepend = useCallback((memory: Memory) => {
    setMemories((current) =>
      current.some((existing) => existing.id === memory.id)
        ? current
        : [memory, ...current],
    );
    setStatus((current) => (current === "error" ? current : "ready"));
  }, []);

  // Swap in an edited memory, keeping its place in the list
  const replace = useCallback((memory: Memory) => {
    setMemories((current) =>
      current.map((existing) =>
        existing.id === memory.id ? memory : existing,
      ),
    );
  }, []);

  // Take a deleted memory out of the list
  const remove = useCallback((id: string) => {
    setMemories((current) => current.filter((existing) => existing.id !== id));
  }, []);

  return {
    memories,
    status,
    hasMore: nextCursor !== null,
    isLoadingMore,
    loadMoreFailed,
    loadMore,
    retry,
    prepend,
    replace,
    remove,
  };
}
