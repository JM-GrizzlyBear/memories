import type { Request } from "express";
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

/**
 * Replaces the current session with a brand-new one (new session id).
 * Protects against session fixation: an attacker can't plant a known
 * session id before login and reuse it after the user logs in.
 * express-session uses callbacks, so we wrap it in a Promise to `await` it.
 */
export function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}
