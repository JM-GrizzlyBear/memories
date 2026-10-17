import "dotenv/config";
import path from "node:path";
import { buildApp } from "./buildApp.js";
import { createPool } from "./infrastructure/database/pool.js";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import {
  createPhotoStorage,
  photoStorageKind,
} from "./infrastructure/storage/createPhotoStorage.js";
import { createSocketServer } from "./presentation/realtime/socketServer.js";

const port = Number(process.env.PORT ?? 4000);
const isProduction = process.env.NODE_ENV === "production";
const webDistDir = process.env.WEB_DIST_DIR; // set only in the Docker image
const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? "uploads");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) throw new Error("SESSION_SECRET is missing");

const pool = createPool(databaseUrl);
await pool.query("SELECT 1");
console.log("Connected to database");

// Infrastructure
const photoStorage = createPhotoStorage(process.env, uploadsDir);
if (photoStorageKind(process.env) === "cloudinary") {
  console.log("Photos are stored in Cloudinary");
} else {
  console.log(`Photos are stored in ${uploadsDir}`);
  if (isProduction) {
    console.warn(
      "Warning: photos are saved on this server's disk and are lost on every redeploy. Set PHOTO_STORAGE=cloudinary.",
    );
  }
}
const { app, sessionMiddleware, realtime, chatInbox } = buildApp({
  pool,
  sessionSecret,
  photoStorage,
  passwordHasher: new BcryptPasswordHasher(),
  isProduction,
  uploadsDir,
  webDistDir,
});

const server = app.listen(port, () => {
  console.log(`API running on port ${port}`);
});

// Live updates (notifications, messages, typing) over the same server
const io = createSocketServer(server, sessionMiddleware, {
  typing: async (userId, conversationId) =>
    await chatInbox.typing(conversationId, userId),
});
realtime.attach(io);

// Render stops old containers with SIGTERM: finish requests, close the DB, exit
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  void io.close(); // closes the live connections, then the server
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});
