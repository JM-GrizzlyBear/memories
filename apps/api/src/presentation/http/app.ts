import path from "node:path";
import express, { type RequestHandler, type Router } from "express";

interface AppDependencies {
  authRouter: Router;
  sessionMiddleware: RequestHandler;
  isProduction: boolean;
  webDistDir?: string; // folder of the built React site (only in Docker)
}

export function createApp({
  authRouter,
  sessionMiddleware,
  isProduction,
  webDistDir,
}: AppDependencies) {
  const app = express();

  // Render sits in front of us and handles HTTPS. Trusting its proxy lets
  // Express see the request as secure, so the secure cookie is sent.
  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(express.json());

  // Health check first: no session needed
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(sessionMiddleware);
  app.use("/api/auth", authRouter);

  // In production, the same server sends the React site
  if (webDistDir) {
    app.use(express.static(webDistDir));

    // Any other GET (like /login on refresh) gets index.html,
    // and React Router shows the right page
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) return next();
      res.sendFile(path.join(webDistDir, "index.html"));
    });
  }

  return app;
}
