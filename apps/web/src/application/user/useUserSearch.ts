import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchUsers } from "../../infrastructure/api/userApi";
import { useDebouncedValue } from "../common/useDebouncedValue";
import { queryKeys } from "../query/queryKeys";

const MIN_LENGTH = 2;
const DELAY_MS = 300; // wait until typing pauses, instead of searching on every key

type Status = "idle" | "searching" | "ready" | "error";

export function useUserSearch(text: string) {
  const typed = text.trim();
  const query = useDebouncedValue(typed, DELAY_MS);
  const isTooShort = typed.length < MIN_LENGTH || query.length < MIN_LENGTH;

  const search = useQuery({
    queryKey: queryKeys.userSearch(query),
    // TanStack Query cancels the request (signal) when a newer search replaces it
    queryFn: async ({ signal }) => await searchUsers(query, signal),
    enabled: !isTooShort,
    placeholderData: keepPreviousData, // keep the last results while the next ones load
  });

  const status: Status = isTooShort
    ? "idle"
    : search.isPending
      ? "searching"
      : search.isError
        ? "error"
        : "ready";

  return {
    results: isTooShort ? [] : (search.data ?? []),
    status,
    minLength: MIN_LENGTH,
  };
}
