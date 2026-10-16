import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query/queryKeys";
import { useRealtimeEvent } from "../realtime/useRealtime";

// Someone changed who can message them: profiles on screen load again,
// so their Message button appears (or goes away) without a refresh
export function useLiveProfiles() {
  const queryClient = useQueryClient();
  useRealtimeEvent<{ userId: string; username: string }>(
    "profile:changed",
    ({ username }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profile(username),
      });
      // "New message" search only lists people you're allowed to reach
      void queryClient.invalidateQueries({
        queryKey: ["conversations", "people"],
      });
    },
  );
}
