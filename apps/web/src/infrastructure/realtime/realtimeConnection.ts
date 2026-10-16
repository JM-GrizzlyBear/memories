import type { Socket } from "socket.io-client";
import { connectRealtime } from "./socket";

// The one live connection of this tab, shared by everything that listens
// (notifications, messages, typing). React reads it with useSyncExternalStore.
let socket: Socket | null = null;
let userId: string | null = null;
const listeners = new Set<() => void>();

function changed() {
  for (const listener of listeners) listener();
}

export const realtimeConnection = {
  // Connect for this person (or keep the connection if it's already theirs)
  open(forUserId: string) {
    if (socket && userId === forUserId) return;
    socket?.disconnect();
    socket = connectRealtime();
    userId = forUserId;
    changed();
  },

  close() {
    if (!socket) return;
    socket.disconnect();
    socket = null;
    userId = null;
    changed();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  current(): Socket | null {
    return socket;
  },
};
