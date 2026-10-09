import { useEffect, useState } from "react";
import type { UserSearchResult } from "../../domain/friendship";
import { searchUsers } from "../../infrastructure/api/userApi";

const MIN_LENGTH = 2;
const DELAY_MS = 300; // wait until typing pauses, instead of searching on every key

type Status = "idle" | "searching" | "ready" | "error";

export function useUserSearch(text: string) {
  const query = text.trim();
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const isTooShort = query.length < MIN_LENGTH;

  useEffect(() => {
    if (isTooShort) return;

    // A newer search cancels the older one, so old answers can't overwrite new ones
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("searching");
      try {
        const users = await searchUsers(query, controller.signal);
        setResults(users);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isTooShort]);

  return {
    results: isTooShort ? [] : results,
    status: isTooShort ? "idle" : status,
    minLength: MIN_LENGTH,
  };
}
