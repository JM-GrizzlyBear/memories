import path from "node:path";
import { CreateMemory } from "./application/memory/CreateMemory.js";
import { PostgresMemoryRepository } from "./infrastructure/database/PostgresMemoryRepository.js";
import { LocalPhotoStorage } from "./infrastructure/storage/LocalPhotoStorage.js";
import { MemoryController } from "./presentation/http/memories/MemoryController.js";
import { createMemoryRouter } from "./presentation/http/memories/memoryRoutes.js";
import "dotenv/config";
import { GetCurrentUser } from "./application/user/GetCurrentUser.js";
import { LoginUser } from "./application/user/LoginUser.js";
import { RegisterUser } from "./application/user/RegisterUser.js";
import { createPool } from "./infrastructure/database/pool.js";
import { PostgresUserRepository } from "./infrastructure/database/PostgresUserRepository.js";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import { createApp } from "./presentation/http/app.js";
import { AuthController } from "./presentation/http/auth/AuthController.js";
import { createAuthRouter } from "./presentation/http/auth/authRoutes.js";
import { createSessionMiddleware } from "./presentation/http/session.js";
import { ListJournal } from "./application/memory/ListJournal.js";

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

const passwordHasher = new BcryptPasswordHasher();
const userRepository = new PostgresUserRepository(pool);
const registerUser = new RegisterUser(userRepository, passwordHasher);
const loginUser = new LoginUser(userRepository, passwordHasher);
const getCurrentUser = new GetCurrentUser(userRepository);
const authController = new AuthController(
  registerUser,
  loginUser,
  getCurrentUser,
);
const authRouter = createAuthRouter(authController);
const photoStorage = new LocalPhotoStorage(uploadsDir);
const memoryRepository = new PostgresMemoryRepository(pool);
const createMemory = new CreateMemory(memoryRepository, photoStorage);
const listJournal = new ListJournal(memoryRepository);
const memoryController = new MemoryController(createMemory, listJournal);
const memoryRouter = createMemoryRouter(memoryController);
const sessionMiddleware = createSessionMiddleware(pool, sessionSecret);

const app = createApp({
  authRouter,
  memoryRouter,
  sessionMiddleware,
  isProduction,
  uploadsDir,
  webDistDir,
});

const server = app.listen(port, () => {
  console.log(`API running on port ${port}`);
});

// Render stops old containers with SIGTERM: finish requests, close the DB, exit
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});
