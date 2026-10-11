import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../infrastructure/api/http";
import { getProfile } from "../../infrastructure/api/userApi";
import { queryKeys } from "../query/queryKeys";

type Status = "loading" | "ready" | "not-found" | "error";

// Someone's profile. Friend actions refresh it by themselves (see useFriendship).
export function useProfile(username: string) {
  const query = useQuery({
    queryKey: queryKeys.profile(username),
    queryFn: async () => await getProfile(username),
    // The friendship can change from the other side (they accept or unfriend),
    // so look again whenever the profile is opened or I come back to the tab
    staleTime: 0,
  });

  const isNotFound =
    query.error instanceof ApiError && query.error.status === 404;

  const status: Status = isNotFound
    ? "not-found"
    : query.data
      ? "ready"
      : query.isError
        ? "error"
        : "loading";

  return {
    profile: query.data ?? null,
    status,
    retry: () => void query.refetch(),
  };
}
