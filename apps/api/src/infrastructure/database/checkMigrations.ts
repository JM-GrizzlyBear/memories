import { readdir } from "node:fs/promises";
import path from "node:path";
import type { Pool } from "pg";

// Warns at startup when the database is missing migrations, so a forgotten
// "pnpm turbo run db:migrate" shows up here instead of as a 500 later
export async function warnAboutPendingMigrations(
  pool: Pool,
  directory: string,
) {
  let files: string[];
  try {
    files = (await readdir(directory)).filter((file) => file.endsWith(".sql"));
  } catch {
    return; // no migrations folder here (e.g. inside the Docker image)
  }

  let applied: Set<string>;
  try {
    const result = await pool.query<{ version: string }>(
      "SELECT version FROM schema_migrations",
    );
    applied = new Set(result.rows.map((row) => row.version));
  } catch {
    applied = new Set(); // no migrations ran at all
  }

  const pending = files
    .filter((file) => !applied.has(file.split("_")[0]))
    .sort();
  if (pending.length === 0) return;

  console.warn(
    [
      "",
      `⚠  The database is missing ${pending.length} migration(s):`,
      ...pending.map((file) => `   - ${file}`),
      "   Some features will fail (500 errors) until you run:",
      "   pnpm turbo run db:migrate",
      "",
    ].join("\n"),
  );
}

export function migrationsDirectory() {
  return path.resolve("db/migrations");
}
