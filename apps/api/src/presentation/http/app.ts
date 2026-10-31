import express, { type RequestHandler, type Router } from "express";
import { apiNotFound, errorHandler } from "./errorHandler.js";

interface AppDependencies {
  authRouter: Router;
  accountRouter: Router;
  memoryRouter: Router;
  friendRouter: Router;
  userRouter: Router;
  notificationRouter: Router;
  albumRouter: Router;
  conversationRouter: Router;
  sessionMiddleware: RequestHandler;
  // How many proxies sit in front of the API (0: none, like locally)
  trustProxy: number;
  uploadsDir: string;
}

export function createApp({
  authRouter,
  accountRouter,
  memoryRouter,
  friendRouter,
  userRouter,
  notificationRouter,
  albumRouter,
  conversationRouter,
  sessionMiddleware,
  trustProxy,
  uploadsDir,
}: AppDependencies) {
  const app = express();

  // Behind proxies, the visitor's real IP address and https come from their headers
  if (trustProxy > 0) {
    app.set("trust proxy", trustProxy);
  }

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(
    "/uploads",
    express.static(uploadsDir, {
      setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
    }),
  );

  app.use(sessionMiddleware);
  app.use("/api/auth", authRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/memories", memoryRouter);
  app.use("/api/friends", friendRouter);
  app.use("/api/users", userRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/album", albumRouter);
  app.use("/api/conversations", conversationRouter);
  app.use("/api", apiNotFound);

  // Only the API lives here. The website is on Netlify, which forwards
  // /api, /socket.io and /uploads to this server; any other address is a 404.

  // Must be last: catches errors from every route above
  app.use(errorHandler);

  return app;
}
