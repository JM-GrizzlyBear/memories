import { useEffect, useState } from "react";
import type { Memory } from "../../domain/memory";
import { ApiError } from "../../infrastructure/api/http";
import { getMemory } from "../../infrastructure/api/memoryApi";

type Status = "loading" | "ready" | "not-found" | "error";

// Loads one memory. If the Journal passed it along, it shows right away
// and is refreshed quietly (likes and comments may have changed since).
export function useMemory(id: string, initial: Memory | null) {
  const hasInitial = initial?.id === id;
  const [memory, setMemory] = useState<Memory | null>(
    hasInitial ? initial : null,
  );
  const [status, setStatus] = useState<Status>(
    hasInitial ? "ready" : "loading",
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const loaded = await getMemory(id);
        if (cancelled) return;
        setMemory(loaded);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        if (hasInitial) {
          // Already showing it: a deleted or hidden memory still becomes "not available"
          if (error instanceof ApiError && error.status === 404) {
            setStatus("not-found");
          }
          return;
        }
        setStatus(
          error instanceof ApiError && error.status === 404
            ? "not-found"
            : "error",
        );
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [id, hasInitial]);

  return { memory, status, setMemory };
}
