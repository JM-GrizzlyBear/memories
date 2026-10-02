import express, { type Router } from "express";

interface AppDependencies {
  authRouter: Router;
}

export function createApp({ authRouter }: AppDependencies) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);

  return app;
}
