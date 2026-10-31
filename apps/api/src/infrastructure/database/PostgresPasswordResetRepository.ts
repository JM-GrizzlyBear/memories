import type { Pool } from "pg";
import type { PasswordResetLink } from "../../domain/passwordReset/PasswordResetLink.js";
import type {
  NewPasswordResetLink,
  PasswordResetRepository,
} from "../../domain/passwordReset/PasswordResetRepository.js";

interface LinkRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export class PostgresPasswordResetRepository implements PasswordResetRepository {
  constructor(private readonly pool: Pool) {}

  async replaceForUser(link: NewPasswordResetLink): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // Asking again cancels the older emails' links
      await client.query(
        "DELETE FROM password_reset_links WHERE user_id = $1",
        [link.userId],
      );
      await client.query(
        `INSERT INTO password_reset_links (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [link.userId, link.tokenHash, link.expiresAt],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetLink | null> {
    const result = await this.pool.query<LinkRow>(
      `SELECT id, user_id, token_hash, expires_at, used_at, created_at
         FROM password_reset_links WHERE token_hash = $1`,
      [tokenHash],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    };
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    // The used one stays (so reusing it says "doesn't work"); the user's others go
    await this.pool.query(
      `DELETE FROM password_reset_links
        WHERE user_id = (SELECT user_id FROM password_reset_links WHERE id = $1) AND id <> $1`,
      [id],
    );
    await this.pool.query(
      "UPDATE password_reset_links SET used_at = $2 WHERE id = $1",
      [id, usedAt],
    );
  }
}
