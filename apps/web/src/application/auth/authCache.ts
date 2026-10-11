import type { QueryClient } from "@tanstack/react-query";
import type { User } from "../../domain/user";
import { queryKeys } from "../query/queryKeys";

// Remember who is logged in. When it becomes a different person (or nobody),
// forget everything loaded for the last person, so nobody sees someone else's data.
export function rememberUser(queryClient: QueryClient, next: User | null) {
  const current = queryClient.getQueryData<User | null>(queryKeys.me);
  if (current?.id !== next?.id) {
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== queryKeys.me[0],
    });
  }
  queryClient.setQueryData(queryKeys.me, next);
}

// My name or photo changed: everything that shows me (cards, comments, lists) loads again
export function refreshEverythingShowingMe(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] !== queryKeys.me[0],
  });
}
