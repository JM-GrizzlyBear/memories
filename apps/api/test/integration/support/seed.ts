import bcrypt from "bcryptjs";
import type { Pool } from "pg";

export const PASSWORD = "password123";
// Hashed once with few rounds, so logging in during tests is fast
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);

// The same people in every test, with fixed ids so tests can use them directly.
//   maria ── friends ── ana
//   maria ── friends ── ben
//   cara: nobody's friend
export const USERS = {
  maria: {
    id: "00000000-0000-4000-8000-000000000001",
    username: "maria",
    firstName: "Maria",
    lastName: "Santos",
  },
  ana: {
    id: "00000000-0000-4000-8000-000000000002",
    username: "ana",
    firstName: "Ana",
    lastName: "Cruz",
  },
  ben: {
    id: "00000000-0000-4000-8000-000000000003",
    username: "ben",
    firstName: "Ben",
    lastName: "Reyes",
  },
  cara: {
    id: "00000000-0000-4000-8000-000000000004",
    username: "cara",
    firstName: "Cara",
    lastName: "Lim",
  },
} as const;

export type Username = keyof typeof USERS;

const FRIENDS: [Username, Username][] = [
  ["maria", "ana"],
  ["maria", "ben"],
];

// Empties every table (except the migrations list), then adds the seed data again.
// Called before every test, so each one starts from exactly the same database.
export async function resetDatabase(pool: Pool) {
  const tables = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> 'schema_migrations'`,
  );
  const names = tables.rows.map((row) => `"${row.tablename}"`).join(", ");
  await pool.query(`TRUNCATE ${names} RESTART IDENTITY CASCADE`);

  for (const user of Object.values(USERS)) {
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, first_name, last_name, birthday)
       VALUES ($1, $2, $3, $4, $5, $6, '1999-05-14')`,
      [
        user.id,
        user.username,
        `${user.username}@example.com`,
        PASSWORD_HASH,
        user.firstName,
        user.lastName,
      ],
    );
  }
  for (const [a, b] of FRIENDS) {
    await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id, status, accepted_at)
       VALUES ($1, $2, 'accepted', now())`,
      [USERS[a].id, USERS[b].id],
    );
  }
}
