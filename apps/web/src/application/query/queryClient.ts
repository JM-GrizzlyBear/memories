import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "../../infrastructure/api/http";
import { rememberUser } from "../auth/authCache";

// A 4xx answer (not found, not allowed, bad input) won't change if we ask again
function isClientError(error: unknown) {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

// The session ran out (or was ended on another device): show the login page
function logOutIfSessionEnded(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    rememberUser(queryClient, null);
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: logOutIfSessionEnded }),
  mutationCache: new MutationCache({ onError: logOutIfSessionEnded }),
  defaultOptions: {
    queries: {
      // Data counts as fresh for 30 seconds: going back to a page shows it instantly,
      // and after that it's refreshed quietly in the background
      staleTime: 30_000,
      // Network hiccup: try once more. A 4xx: don't bother.
      retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
    },
  },
});
