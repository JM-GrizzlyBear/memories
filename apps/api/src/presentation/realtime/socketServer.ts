import type { RequestHandler } from "express";
import type { Session, SessionData } from "express-session";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";
import { userRoom } from "../../infrastructure/realtime/SocketIoPublisher.js";

// The session middleware puts the login session on the raw request too
declare module "node:http" {
  interface IncomingMessage {
    session: Session & Partial<SessionData>;
  }
}

// What the browser can send us (everything else only goes the other way)
export interface SocketHandlers {
  typing: (userId: string, conversationId: string) => Promise<void>;
}

const uuid = z.uuid();

// Live updates over a WebSocket, on the same address as the API (path /socket.io)
export function createSocketServer(
  httpServer: HttpServer,
  sessionMiddleware: RequestHandler,
  handlers: SocketHandlers,
) {
  const io = new Server(httpServer, { serveClient: false });

  // Reuse the login cookie: the same session that logs you into the API
  io.engine.use(sessionMiddleware);

  // Only logged-in people may connect
  io.use((socket, next) => {
    if (!socket.request.session.userId) {
      next(new Error("Not logged in"));
      return;
    }
    next();
  });

  // Each person's tabs share a private room, so events reach only them
  io.on("connection", (socket) => {
    const userId = socket.request.session.userId;
    if (!userId) return;
    void socket.join(userRoom(userId));

    // "I'm typing in this chat" (the browser sends it at most every few seconds)
    socket.on("typing", async (payload: unknown) => {
      const conversationId =
        typeof payload === "object" &&
        payload !== null &&
        "conversationId" in payload
          ? uuid.safeParse(payload.conversationId)
          : null;
      if (!conversationId?.success) return;
      try {
        await handlers.typing(userId, conversationId.data);
      } catch (error) {
        console.error("Couldn't handle typing", error);
      }
    });
  });

  return io;
}
