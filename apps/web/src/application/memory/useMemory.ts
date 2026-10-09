import { useEffect, useState } from "react";
import type { Memory } from "../../domain/memory";
import { ApiError } from "../../infrastructure/api/http";
import { getMemory } from "../../infrastructure/api/memoryApi";

type Status = "loading" | "ready" | "not-found" | "error";

// Loads one memory, unless we already have it (passed from the Journal)
export function useMemory(id: string, initial: Memory | null) {
  const hasInitial = initial?.id === id;
  const [memory, setMemory] = useState<Memory | null>(
    hasInitial ? initial : null,
  );
  const [status, setStatus] = useState<Status>(
    hasInitial ? "ready" : "loading",
  );

  useEffect(() => {
    if (hasInitial) return;

    let cancelled = false;
    async function load() {
      try {
        const loaded = await getMemory(id);
        if (cancelled) return;
        setMemory(loaded);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
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

  return { memory, status };
}
