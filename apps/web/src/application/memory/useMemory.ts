import { useQuery } from "@tanstack/react-query";
import type { Memory } from "../../domain/memory";
import { ApiError } from "../../infrastructure/api/http";
import { getMemory } from "../../infrastructure/api/memoryApi";
import { queryKeys } from "../query/queryKeys";

type Status = "loading" | "ready" | "not-found" | "error";

// Loads one memory. If the Journal passed it along, it shows right away
// and is refreshed quietly (likes and comments may have changed since).
export function useMemory(id: string, initial: Memory | null) {
  const query = useQuery({
    queryKey: queryKeys.memory(id),
    queryFn: async () => await getMemory(id),
    initialData: initial?.id === id ? initial : undefined,
    initialDataUpdatedAt: 0, // treat the passed-along copy as old, so it's checked right away
  });

  // Deleted, or no longer allowed (unfriended): "not available", even if it was showing
  const isNotFound =
    query.error instanceof ApiError && query.error.status === 404;

  const status: Status = isNotFound
    ? "not-found"
    : query.data
      ? "ready"
      : query.isError
        ? "error"
        : "loading";

  return { memory: query.data ?? null, status };
}
