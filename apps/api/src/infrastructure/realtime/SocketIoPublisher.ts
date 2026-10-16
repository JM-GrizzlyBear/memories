import type { Server } from "socket.io";
import type { RealtimePublisher } from "../../application/ports/RealtimePublisher.js";

// Every logged-in tab of a person joins their own room
export function userRoom(userId: string) {
  return `user:${userId}`;
}

// Sends events through Socket.IO. The server is attached once the app is listening,
// so use cases can be created before it exists.
export class SocketIoPublisher implements RealtimePublisher {
  private io: Server | null = null;

  attach(io: Server) {
    this.io = io;
  }

  publish(userId: string, event: string, payload: unknown) {
    this.io?.to(userRoom(userId)).emit(event, payload);
  }
}
