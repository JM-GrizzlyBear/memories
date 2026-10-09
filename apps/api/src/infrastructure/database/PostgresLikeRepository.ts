import type { Pool } from "pg";
import type { LikeRepository } from "../../domain/like/LikeRepository.js";

export class PostgresLikeRepository implements LikeRepository {
  constructor(private readonly pool: Pool) {}

  async add(memoryId: string, userId: string) {
    // Liking twice (double click, two tabs) keeps a single like
    await this.pool.query(
      `INSERT INTO memory_likes (memory_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [memoryId, userId],
    );
  }

  async remove(memoryId: string, userId: string) {
    await this.pool.query(
      "DELETE FROM memory_likes WHERE memory_id = $1 AND user_id = $2",
      [memoryId, userId],
    );
  }

  async count(memoryId: string) {
    const result = await this.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM memory_likes WHERE memory_id = $1",
      [memoryId],
    );
    return result.rows[0].count;
  }
}
