import type { Pool } from "pg";
import type {
  Comment,
  CommentWithMemoryOwner,
} from "../../domain/comment/Comment.js";
import type {
  CommentRepository,
  NewComment,
} from "../../domain/comment/CommentRepository.js";

interface CommentRow {
  id: string;
  memory_id: string;
  body: string;
  created_at: Date;
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
}

// A comment with its author's public details
const SELECT_COMMENT = `
  SELECT c.id, c.memory_id, c.body, c.created_at,
         u.id AS user_id, u.username, u.first_name, u.last_name, u.profile_photo_url
    FROM memory_comments c
    JOIN users u ON u.id = c.user_id`;

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    memoryId: row.memory_id,
    body: row.body,
    createdAt: row.created_at,
    author: {
      id: row.user_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      profilePhotoUrl: row.profile_photo_url,
    },
  };
}

export class PostgresCommentRepository implements CommentRepository {
  constructor(private readonly pool: Pool) {}

  async create({ memoryId, userId, body }: NewComment): Promise<Comment> {
    // Insert, then read it back with the author in the same statement
    const result = await this.pool.query<CommentRow>(
      `WITH inserted AS (
         INSERT INTO memory_comments (memory_id, user_id, body)
         VALUES ($1, $2, $3)
         RETURNING *
       )
       SELECT c.id, c.memory_id, c.body, c.created_at,
              u.id AS user_id, u.username, u.first_name, u.last_name, u.profile_photo_url
         FROM inserted c
         JOIN users u ON u.id = c.user_id`,
      [memoryId, userId, body],
    );
    return toComment(result.rows[0]);
  }

  async listForMemory(memoryId: string, limit: number): Promise<Comment[]> {
    const result = await this.pool.query<CommentRow>(
      `${SELECT_COMMENT}
      WHERE c.memory_id = $1
      ORDER BY c.created_at, c.id
      LIMIT $2`,
      [memoryId, limit],
    );
    return result.rows.map(toComment);
  }

  async findById(id: string): Promise<CommentWithMemoryOwner | null> {
    const result = await this.pool.query<
      CommentRow & { memory_owner_id: string }
    >(
      `SELECT c.id, c.memory_id, c.body, c.created_at,
              u.id AS user_id, u.username, u.first_name, u.last_name, u.profile_photo_url,
              m.user_id AS memory_owner_id
         FROM memory_comments c
         JOIN users u ON u.id = c.user_id
         JOIN memories m ON m.id = c.memory_id
        WHERE c.id = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) return null;
    return { ...toComment(row), memoryOwnerId: row.memory_owner_id };
  }

  async delete(id: string) {
    await this.pool.query("DELETE FROM memory_comments WHERE id = $1", [id]);
  }
}
