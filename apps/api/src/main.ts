import "dotenv/config";
import { createPool } from "./infrastructure/database/pool.js";
import { createApp } from "./presentation/http/app.js";

const port = Number(process.env.PORT ?? 4000);
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");

const pool = createPool(databaseUrl);
await pool.query("SELECT 1");
console.log("Connected to database");

createApp().listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
