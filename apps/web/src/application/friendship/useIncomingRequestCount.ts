import { useQuery } from "@tanstack/react-query";
import { listFriendRequests } from "../../infrastructure/api/friendApi";
import { queryKeys } from "../query/queryKeys";

// How many people are waiting for my answer (the badge in the header).
// Shares its data with the Requests list on the Friends page.
// Checked when the app opens, after my own friend actions, and when I come back
// to the tab. (Socket.IO will later tell us the moment a request arrives.)
export function useIncomingRequestCount() {
  const { data } = useQuery({
    queryKey: queryKeys.friendRequests,
    queryFn: async () => await listFriendRequests(),
    select: (requests) => requests.incoming.length,
    staleTime: 0, // always look again when I come back to the tab
  });
  return data ?? 0;
}
