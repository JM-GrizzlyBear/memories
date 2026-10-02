import "dotenv/config";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import { createPool } from "./infrastructure/database/pool.js";
import { createApp } from "./presentation/http/app.js";
import { createAuthRouter } from "./presentation/http/auth/authRoutes.js";
import { AuthController } from "./presentation/http/auth/AuthController.js";
import { RegisterUser } from "./application/user/RegisterUser.js";
import { PostgresUserRepository } from "./infrastructure/database/PostgresUserRepository.js";

const port = Number(process.env.PORT ?? 4000);
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");

const pool = createPool(databaseUrl);
await pool.query("SELECT 1");
console.log("Connected to database");

const passwordHasher = new BcryptPasswordHasher();
const userRepository = new PostgresUserRepository(pool);
const registerUser = new RegisterUser(userRepository, passwordHasher);
const authController = new AuthController(registerUser);
const authRouter = createAuthRouter(authController);

createApp({ authRouter }).listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
