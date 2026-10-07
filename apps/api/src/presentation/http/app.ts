import path from "node:path";
import express, { type RequestHandler, type Router } from "express";

interface AppDependencies {
  authRouter: Router;
  memoryRouter: Router;
  sessionMiddleware: RequestHandler;
  isProduction: boolean;
  uploadsDir: string;
  webDistDir?: string;
}

export function createApp({
  authRouter,
  memoryRouter,
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
  app.use("/api/memories", memoryRouter);

  if (webDistDir) {
    app.use(express.static(webDistDir));

    app.use((req, res, next) => {
      const isApiOrFile =
        req.path.startsWith("/api") || req.path.startsWith("/uploads");
      if (req.method !== "GET" || isApiOrFile) return next();
      res.sendFile(path.join(webDistDir, "index.html"));
    });
  }

  return app;
}
