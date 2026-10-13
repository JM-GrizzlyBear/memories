import type { RequestHandler } from "express";
import type { Session, SessionData } from "express-session";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { userRoom } from "../../infrastructure/realtime/SocketIoPublisher.js";

// The session middleware puts the login session on the raw request too
declare module "node:http" {
  interface IncomingMessage {
    session: Session & Partial<SessionData>;
  }
}

// Live updates over a WebSocket, on the same address as the API (path /socket.io)
export function createSocketServer(
  httpServer: HttpServer,
  sessionMiddleware: RequestHandler,
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
    if (userId) void socket.join(userRoom(userId));
  });

  return io;
}
