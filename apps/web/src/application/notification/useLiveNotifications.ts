import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { AppNotification } from "../../domain/notification";
import { connectRealtime } from "../../infrastructure/realtime/socket";
import { useAuth } from "../auth/useAuth";
import { queryKeys } from "../query/queryKeys";

// While I'm logged in, listen for new notifications. Each one refreshes what it
// changes (the bell, the list, friend lists, the memory) and is handed to `onNew`.
export function useLiveNotifications(
  onNew: (notification: AppNotification) => void,
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  // The latest onNew, without reconnecting every time it changes
  const onNewRef = useRef(onNew);
  useEffect(() => {
    onNewRef.current = onNew;
  }, [onNew]);

  useEffect(() => {
    if (!userId) return;

    const socket = connectRealtime();

    socket.on("notification", (notification: AppNotification) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });

      if (
        notification.type === "friend_request" ||
        notification.type === "friend_accepted"
      ) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.friends });
        void queryClient.invalidateQueries({ queryKey: queryKeys.users });
        void queryClient.invalidateQueries({ queryKey: queryKeys.journals });
        void queryClient.invalidateQueries({ queryKey: queryKeys.albums });
      }
      if (notification.memory) {
        // New like or comment counts (and the comment itself)
        void queryClient.invalidateQueries({
          queryKey: queryKeys.memory(notification.memory.id),
        });
      }

      onNewRef.current(notification);
    });

    // Logged out, or a different person logged in: close this connection
    return () => {
      socket.disconnect();
    };
  }, [userId, queryClient]);
}
