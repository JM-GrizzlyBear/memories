import express, { RequestHandler, type Router } from "express";

interface AppDependencies {
  authRouter: Router;
  sessionMiddleware: RequestHandler;
}

export function createApp({ authRouter, sessionMiddleware }: AppDependencies) {
  const app = express();
  app.use(express.json());

  app.use(sessionMiddleware);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);

  return app;
}
