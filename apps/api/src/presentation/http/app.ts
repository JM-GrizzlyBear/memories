import path from "node:path";
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
  isProduction: boolean;
  uploadsDir: string;
  webDistDir?: string;
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
  isProduction,
  uploadsDir,
  webDistDir,
}: AppDependencies) {
  const app = express();

  if (isProduction) {
    app.set("trust proxy", 1);
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

  if (webDistDir) {
    app.use(express.static(webDistDir));

    app.use((req, res, next) => {
      const isApiOrFile =
        req.path.startsWith("/api") || req.path.startsWith("/uploads");
      if (req.method !== "GET" || isApiOrFile) return next();
      res.sendFile(path.join(webDistDir, "index.html"));
    });
  }

  // Must be last: catches errors from every route above
  app.use(errorHandler);

  return app;
}
