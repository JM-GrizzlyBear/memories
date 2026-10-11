import { useQuery } from "@tanstack/react-query";
import { listFriendRequests } from "../../infrastructure/api/friendApi";
import { queryKeys } from "../query/queryKeys";

// Someone else can send me a request at any time, so look again every 30 seconds
// while the tab is open, and right away when I come back to the tab.
// (Socket.IO will later tell us the moment it happens.)
const CHECK_EVERY_MS = 30_000;

// How many people are waiting for my answer (the badge in the header).
// Shares its data with the Requests list on the Friends page.
export function useIncomingRequestCount() {
  const { data } = useQuery({
    queryKey: queryKeys.friendRequests,
    queryFn: async () => await listFriendRequests(),
    select: (requests) => requests.incoming.length,
    staleTime: 0, // always look again when I come back to the tab
    refetchInterval: CHECK_EVERY_MS, // paused automatically while the tab is hidden
  });
  return data ?? 0;
}
