import { useQueryClient } from "@tanstack/react-query";
import type { AppNotification } from "../../domain/notification";
import { queryKeys } from "../query/queryKeys";
import { useRealtimeEvent } from "../realtime/useRealtime";

// While I'm logged in, listen for new notifications. Each one refreshes what it
// changes (the bell, the list, friend lists, the memory) and is handed to `onNew`.
export function useLiveNotifications(
  onNew: (notification: AppNotification) => void,
) {
  const queryClient = useQueryClient();

  useRealtimeEvent<AppNotification>("notification", (notification) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });

    if (
      notification.type === "friend_request" ||
      notification.type === "friend_accepted"
    ) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.journals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.albums });
      // A waiting message request may have just been accepted by itself
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    }
    if (notification.memory) {
      // New like or comment counts (and the comment itself)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memory(notification.memory.id),
      });
    }

    onNew(notification);
  });
}
