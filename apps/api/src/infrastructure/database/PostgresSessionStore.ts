import type { Pool } from "pg";
import type { SessionStore } from "../../application/ports/SessionStore.js";

// Works on the "session" table that connect-pg-simple keeps (sess holds { userId, cookie })
export class PostgresSessionStore implements SessionStore {
  constructor(private readonly pool: Pool) {}

  async deleteOtherSessions(
    userId: string,
    keepSessionId: string,
  ): Promise<void> {
    await this.pool.query(
      `DELETE FROM session WHERE sess->>'userId' = $1 AND sid <> $2`,
      [userId, keepSessionId],
    );
  }

  async deleteAllSessions(userId: string): Promise<void> {
    await this.pool.query(`DELETE FROM session WHERE sess->>'userId' = $1`, [
      userId,
    ]);
  }
}
