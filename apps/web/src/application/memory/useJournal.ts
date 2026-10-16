import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Memory } from "../../domain/memory";
import { listJournal } from "../../infrastructure/api/memoryApi";
import { queryKeys } from "../query/queryKeys";

type Status = "loading" | "ready" | "error";

// Loads the journal page by page ("Show older memories").
// With an authorId, only that person's memories (for their profile).
export function useJournal(authorId: string | null = null) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.journal(authorId),
    queryFn: async ({ pageParam }) => await listJournal(pageParam, authorId),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor, // null = no older memories
  });

  // All loaded pages as one list (never the same memory twice)
  const memories = useMemo(() => {
    const seen = new Set<string>();
    const all: Memory[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const memory of page.memories) {
        if (seen.has(memory.id)) continue;
        seen.add(memory.id);
        all.push(memory);
      }
    }
    return all;
  }, [query.data]);

  // Once something is loaded, keep showing it even if a background refresh fails
  const status: Status = query.data
    ? "ready"
    : query.isError
      ? "error"
      : "loading";

  return {
    memories,
    status,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMoreFailed: query.isFetchNextPageError,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}
