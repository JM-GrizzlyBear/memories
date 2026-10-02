import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Pool } from "pg";

// Tell TypeScript what we store in a session
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function createSessionMiddleware(pool: Pool, secret: string) {
  const PgStore = connectPgSimple(session);

  return session({
    store: new PgStore({ pool, tableName: "session" }),
    name: "memories.sid",
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  });
}
