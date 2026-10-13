import type { Pool } from "pg";
import type {
  NewNotification,
  NotificationType,
  NotificationView,
} from "../../domain/notification/Notification.js";
import type {
  NotificationCursor,
  NotificationPageItem,
  NotificationRepository,
} from "../../domain/notification/NotificationRepository.js";

interface NotificationRow {
  id: string;
  type: NotificationType;
  read_at: Date | null;
  created_at: Date;
  cursor_created_at: string;
  actor_id: string;
  actor_username: string;
  actor_first_name: string;
  actor_last_name: string;
  actor_photo_url: string | null;
  memory_id: string | null;
  memory_title: string | null;
  memory_cover_url: string | null;
  comment_preview: string | null;
  is_available: boolean;
}

// A notification with who did it, what it's about, and whether that still exists
const SELECT_VIEW = `
  SELECT n.id, n.type, n.read_at, n.created_at, n.created_at::text AS cursor_created_at,
         a.id AS actor_id, a.username AS actor_username, a.first_name AS actor_first_name,
         a.last_name AS actor_last_name, a.profile_photo_url AS actor_photo_url,
         m.id AS memory_id, m.title AS memory_title,
         (SELECT p.url FROM memory_photos p
           WHERE p.memory_id = m.id ORDER BY p.position LIMIT 1) AS memory_cover_url,
         left(c.body, 120) AS comment_preview,
         CASE n.type
           -- the request is still there, or it became a friendship
           WHEN 'friend_request' THEN EXISTS (
             SELECT 1 FROM friendships f
              WHERE f.requester_id = n.actor_id AND f.addressee_id = n.recipient_id)
           WHEN 'friend_accepted' THEN EXISTS (
             SELECT 1 FROM friendships f
              WHERE f.status = 'accepted'
                AND LEAST(f.requester_id, f.addressee_id) = LEAST(n.actor_id, n.recipient_id)
                AND GREATEST(f.requester_id, f.addressee_id) = GREATEST(n.actor_id, n.recipient_id))
           WHEN 'memory_liked' THEN m.id IS NOT NULL
           ELSE m.id IS NOT NULL AND c.id IS NOT NULL
         END AS is_available
    FROM notifications n
    JOIN users a ON a.id = n.actor_id
    LEFT JOIN memories m ON m.id = n.memory_id
    LEFT JOIN memory_comments c ON c.id = n.comment_id`;

function toView(row: NotificationRow): NotificationView {
  return {
    id: row.id,
    type: row.type,
    actor: {
      id: row.actor_id,
      username: row.actor_username,
      firstName: row.actor_first_name,
      lastName: row.actor_last_name,
      profilePhotoUrl: row.actor_photo_url,
    },
    memory:
      row.memory_id && row.memory_title
        ? {
            id: row.memory_id,
            title: row.memory_title,
            coverUrl: row.memory_cover_url,
          }
        : null,
    commentPreview: row.comment_preview,
    isRead: row.read_at !== null,
    createdAt: row.created_at,
    isAvailable: row.is_available,
  };
}

export class PostgresNotificationRepository implements NotificationRepository {
  constructor(private readonly pool: Pool) {}

  async save(notification: NewNotification): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO notifications (recipient_id, actor_id, type, memory_id, comment_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (recipient_id, actor_id, type, memory_id)
         WHERE type IN ('friend_request', 'friend_accepted', 'memory_liked')
       DO UPDATE SET created_at = now(), read_at = NULL
       RETURNING id`,
      [
        notification.recipientId,
        notification.actorId,
        notification.type,
        notification.memoryId ?? null,
        notification.commentId ?? null,
      ],
    );
    return result.rows[0].id;
  }

  async findView(id: string): Promise<NotificationView | null> {
    const result = await this.pool.query<NotificationRow>(
      `${SELECT_VIEW} WHERE n.id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toView(row) : null;
  }

  async deleteLike(actorId: string, memoryId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM notifications
        WHERE actor_id = $1 AND memory_id = $2 AND type = 'memory_liked'`,
      [actorId, memoryId],
    );
  }

  async list(
    recipientId: string,
    limit: number,
    after: NotificationCursor | null,
  ): Promise<NotificationPageItem[]> {
    const result = await this.pool.query<NotificationRow>(
      `${SELECT_VIEW}
        WHERE n.recipient_id = $1
          AND ($2::timestamptz IS NULL OR (n.created_at, n.id) < ($2::timestamptz, $3::uuid))
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT $4`,
      [recipientId, after?.createdAt ?? null, after?.id ?? null, limit],
    );
    return result.rows.map((row) => ({
      notification: toView(row),
      cursor: { createdAt: row.cursor_created_at, id: row.id },
    }));
  }

  async countUnread(recipientId: string): Promise<number> {
    const result = await this.pool.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM notifications
        WHERE recipient_id = $1 AND read_at IS NULL`,
      [recipientId],
    );
    return result.rows[0].count;
  }

  async markRead(recipientId: string, id: string): Promise<void> {
    await this.pool.query(
      `UPDATE notifications SET read_at = now()
        WHERE id = $2 AND recipient_id = $1 AND read_at IS NULL`,
      [recipientId, id],
    );
  }

  async markAllRead(recipientId: string): Promise<void> {
    await this.pool.query(
      `UPDATE notifications SET read_at = now()
        WHERE recipient_id = $1 AND read_at IS NULL`,
      [recipientId],
    );
  }
}
