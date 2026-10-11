import { useQuery } from "@tanstack/react-query";
import {
  listFriendRequests,
  listFriends,
} from "../../infrastructure/api/friendApi";
import { queryKeys } from "../query/queryKeys";

type Status = "loading" | "ready" | "error";

// My friends, the requests sent to me, and the requests I sent.
// After any friend action these refresh by themselves (see useFriendship).
// Others can change them too, so they're checked again whenever the page is opened
// or I come back to the tab (staleTime: 0).
export function useFriends() {
  const friendsQuery = useQuery({
    queryKey: queryKeys.friendList,
    queryFn: async () => await listFriends(),
    staleTime: 0,
  });
  const requestsQuery = useQuery({
    queryKey: queryKeys.friendRequests,
    queryFn: async () => await listFriendRequests(),
    staleTime: 0,
  });

  const status: Status =
    friendsQuery.data && requestsQuery.data
      ? "ready"
      : friendsQuery.isError || requestsQuery.isError
        ? "error"
        : "loading";

  return {
    friends: friendsQuery.data ?? [],
    incoming: requestsQuery.data?.incoming ?? [],
    outgoing: requestsQuery.data?.outgoing ?? [],
    status,
    retry: () => {
      void friendsQuery.refetch();
      void requestsQuery.refetch();
    },
  };
}
