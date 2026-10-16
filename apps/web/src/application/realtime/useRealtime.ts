import { useEffect, useRef, useSyncExternalStore } from "react";
import { realtimeConnection } from "../../infrastructure/realtime/realtimeConnection";
import { useAuth } from "../auth/useAuth";

// Opens the live connection while someone is logged in, closes it when they log out.
// Rendered once, near the top of the app.
export function useRealtimeConnection() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    realtimeConnection.open(userId);
    return () => realtimeConnection.close();
  }, [userId]);
}

// The live connection (null while logged out)
export function useRealtimeSocket() {
  return useSyncExternalStore(
    realtimeConnection.subscribe,
    realtimeConnection.current,
  );
}

// Run `handler` every time the server sends `event`
export function useRealtimeEvent<T>(
  event: string,
  handler: (payload: T) => void,
) {
  const socket = useRealtimeSocket();

  // The latest handler, without listening again every render
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!socket) return;
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
