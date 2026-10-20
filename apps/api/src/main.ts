import "dotenv/config";
import path from "node:path";
import { buildApp } from "./buildApp.js";
import { createPool } from "./infrastructure/database/pool.js";
import { SmtpAccountEmails } from "./infrastructure/email/SmtpAccountEmails.js";
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
// Account emails (forgot password). Locally: Mailpit from docker compose.
// Without SMTP_HOST (the live site on Render's free plan, which blocks email ports)
// "Forgot password" says it isn't available.
const appUrl = (process.env.APP_URL ?? "http://localhost:5173").replace(
  /\/+$/,
  "",
);
const smtpHost = process.env.SMTP_HOST?.trim();
const accountEmails = smtpHost
  ? new SmtpAccountEmails({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 1025),
      from: process.env.MAIL_FROM ?? "Memories <no-reply@memories.local>",
      appUrl,
    })
  : null;
console.log(
  accountEmails
    ? `Account emails go to SMTP ${smtpHost}:${process.env.SMTP_PORT ?? 1025}`
    : "Account emails are off (no SMTP_HOST): forgot password is unavailable",
);

const { app, sessionMiddleware, realtime, chatInbox } = buildApp({
  pool,
  sessionSecret,
  photoStorage,
  passwordHasher: new BcryptPasswordHasher(),
  isProduction,
  uploadsDir,
  webDistDir,
  accountEmails,
  appUrl,
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
