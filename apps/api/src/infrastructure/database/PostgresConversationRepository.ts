import type { GroupRole } from "@memories/shared";
import type { Pool, PoolClient } from "pg";
import type {
  Conversation,
  ConversationFolder,
  ConversationKind,
  ConversationMember,
  MemberStatus,
  Membership,
  Message,
  MessageablePerson,
  MessageEvent,
  MessagePhoto,
} from "../../domain/conversation/Conversation.js";
import type {
  ConversationRepository,
  MessageCursor,
  MessagePage,
  NewMember,
  NewMessage,
  SavedPhoto,
} from "../../domain/conversation/ConversationRepository.js";
import { directKey } from "../../domain/conversation/rules.js";
import type { UserSummary } from "../../domain/user/User.js";

// A person as JSON, built by Postgres
const userJson = (
  alias: string,
) => `CASE WHEN ${alias}.id IS NULL THEN NULL ELSE json_build_object(
    'id', ${alias}.id, 'username', ${alias}.username, 'firstName', ${alias}.first_name,
    'lastName', ${alias}.last_name, 'profilePhotoUrl', ${alias}.profile_photo_url) END`;

// One message with who sent it, who it's about and its photos
const MESSAGE_SELECT = `
  SELECT m.id, m.conversation_id, m.kind, m.body, m.event,
         m.created_at, m.created_at::text AS created_at_text, m.edited_at, m.unsent_at,
         ${userJson("s")} AS sender,
         ${userJson("t")} AS target,
         COALESCE((SELECT json_agg(json_build_object('id', p.id, 'url', p.url, 'position', p.position)
                                   ORDER BY p.position)
                     FROM message_photos p WHERE p.message_id = m.id), '[]'::json) AS photos
    FROM messages m
    LEFT JOIN users s ON s.id = m.sender_id
    LEFT JOIN users t ON t.id = m.target_user_id`;

interface MessageRow {
  id: string;
  conversation_id: string;
  kind: "text" | "system";
  body: string;
  event: MessageEvent | null;
  created_at: Date;
  created_at_text: string;
  edited_at: Date | null;
  unsent_at: Date | null;
  sender: UserSummary | null;
  target: UserSummary | null;
  photos: MessagePhoto[];
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender,
    kind: row.kind,
    body: row.body,
    event: row.event,
    target: row.target,
    photos: row.photos,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    unsentAt: row.unsent_at,
  };
}

interface ConversationRow {
  id: string;
  kind: ConversationKind;
  name: string | null;
  photo_url: string | null;
  created_at: Date;
  last_message_at: Date | null;
  status: MemberStatus;
  role: GroupRole;
  archived: boolean;
  last_read_at: Date | null;
  left_at: Date | null;
  added_by: UserSummary | null;
  unread: boolean;
}

interface MemberRow {
  conversation_id: string;
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  status: MemberStatus;
  role: GroupRole;
  joined_at: Date;
  last_read_at: Date | null;
}

// Which of my chats each folder holds
const FOLDERS: Record<ConversationFolder, string> = {
  inbox: "me.status IN ('accepted', 'left', 'removed') AND NOT me.archived",
  requests: "me.status = 'request'",
  archive:
    "(me.status = 'declined' OR (me.status IN ('accepted', 'left', 'removed') AND me.archived))",
};

const CONVERSATION_SELECT = `
  SELECT c.id, c.kind, c.name, c.photo_url, c.created_at,
         -- Someone who left sees the chat as it was when they left
         LEAST(c.last_message_at, me.left_at) AS last_message_at,
         me.status, me.role, me.archived, me.last_read_at, me.left_at,
         ${userJson("ab")} AS added_by,
         (me.status = 'accepted' AND EXISTS (
            SELECT 1 FROM messages x
             WHERE x.conversation_id = c.id
               AND x.sender_id IS DISTINCT FROM $1
               AND x.created_at > COALESCE(me.last_read_at, '-infinity'::timestamptz))) AS unread
    FROM conversation_members me
    JOIN conversations c ON c.id = me.conversation_id
    LEFT JOIN users ab ON ab.id = me.added_by AND me.added_by <> me.user_id`;

export class PostgresConversationRepository implements ConversationRepository {
  constructor(private readonly pool: Pool) {}

  // ---------------------------------------------------------------- Reading

  async list(
    viewerId: string,
    folder: ConversationFolder,
    limit: number,
  ): Promise<Conversation[]> {
    const result = await this.pool.query<ConversationRow>(
      `${CONVERSATION_SELECT}
        WHERE me.user_id = $1 AND c.last_message_at IS NOT NULL AND ${FOLDERS[folder]}
        ORDER BY LEAST(c.last_message_at, me.left_at) DESC
        LIMIT $2`,
      [viewerId, limit],
    );
    return this.assemble(result.rows, viewerId);
  }

  async get(conversationId: string, viewerId: string) {
    const result = await this.pool.query<ConversationRow>(
      `${CONVERSATION_SELECT}
        WHERE me.user_id = $1 AND c.id = $2`,
      [viewerId, conversationId],
    );
    const [conversation] = await this.assemble(result.rows, viewerId);
    return conversation ?? null;
  }

  // Adds the members and the last message to each chat (two queries for the whole list)
  private async assemble(
    rows: ConversationRow[],
    viewerId: string,
  ): Promise<Conversation[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);

    const [members, lastMessages] = await Promise.all([
      this.pool.query<MemberRow>(
        `SELECT cm.conversation_id, u.id, u.username, u.first_name, u.last_name,
                u.profile_photo_url, cm.status, cm.role, cm.joined_at, cm.last_read_at
           FROM conversation_members cm
           JOIN conversations c ON c.id = cm.conversation_id
           JOIN users u ON u.id = cm.user_id
          WHERE cm.conversation_id = ANY($1::uuid[])
            -- People who declined a group don't show up in it (except to themselves)
            AND cm.status NOT IN ('left', 'removed')
            AND (cm.status <> 'declined' OR c.kind = 'direct' OR cm.user_id = $2)
          ORDER BY cm.joined_at`,
        [ids, viewerId],
      ),
      this.pool.query<MessageRow>(
        `${MESSAGE_SELECT}
          WHERE m.id IN (SELECT DISTINCT ON (x.conversation_id) x.id
                           FROM messages x
                           JOIN conversation_members v
                             ON v.conversation_id = x.conversation_id AND v.user_id = $2
                          WHERE x.conversation_id = ANY($1::uuid[])
                            AND x.created_at <= COALESCE(v.left_at, 'infinity'::timestamptz)
                          ORDER BY x.conversation_id, x.created_at DESC, x.id DESC)`,
        [ids, viewerId],
      ),
    ]);

    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      photoUrl: row.photo_url,
      createdAt: row.created_at,
      lastMessageAt: row.last_message_at,
      members: members.rows
        .filter((member) => member.conversation_id === row.id)
        .map((member) => toMember(member, viewerId)),
      lastMessage: (() => {
        const last = lastMessages.rows.find(
          (message) => message.conversation_id === row.id,
        );
        return last ? toMessage(last) : null;
      })(),
      me: {
        status: row.status,
        role: row.role,
        archived: row.archived,
        lastReadAt: row.last_read_at,
        addedBy: row.added_by,
      },
      unread: row.unread,
    }));
  }

  async findMembership(
    conversationId: string,
    userId: string,
  ): Promise<Membership | null> {
    const result = await this.pool.query<{
      conversation_id: string;
      kind: ConversationKind;
      user_id: string;
      status: MemberStatus;
      role: GroupRole;
      archived: boolean;
      joined_at: Date;
      left_at: Date | null;
    }>(
      `SELECT cm.conversation_id, c.kind, cm.user_id, cm.status, cm.role, cm.archived,
              cm.joined_at, cm.left_at
         FROM conversation_members cm
         JOIN conversations c ON c.id = cm.conversation_id
        WHERE cm.conversation_id = $1 AND cm.user_id = $2`,
      [conversationId, userId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      conversationId: row.conversation_id,
      kind: row.kind,
      userId: row.user_id,
      status: row.status,
      role: row.role,
      archived: row.archived,
      joinedAt: row.joined_at,
      leftAt: row.left_at,
    };
  }

  async memberIds(conversationId: string): Promise<string[]> {
    const result = await this.pool.query<{ user_id: string }>(
      `SELECT user_id FROM conversation_members
        WHERE conversation_id = $1 AND status NOT IN ('left', 'removed')`,
      [conversationId],
    );
    return result.rows.map((row) => row.user_id);
  }

  async countMembers(conversationId: string): Promise<number> {
    const result = await this.pool.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM conversation_members
        WHERE conversation_id = $1 AND status IN ('accepted', 'request')`,
      [conversationId],
    );
    return result.rows[0].count;
  }

  async findDirect(userA: string, userB: string): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      "SELECT id FROM conversations WHERE direct_key = $1",
      [directKey(userA, userB)],
    );
    return result.rows[0]?.id ?? null;
  }

  async counts(userId: string) {
    const result = await this.pool.query<{ unread: number; requests: number }>(
      `SELECT
         count(*) FILTER (
           WHERE me.status = 'accepted' AND NOT me.archived AND EXISTS (
             SELECT 1 FROM messages x
              WHERE x.conversation_id = c.id
                AND x.sender_id IS DISTINCT FROM $1
                AND x.created_at > COALESCE(me.last_read_at, '-infinity'::timestamptz))
         )::int AS unread,
         count(*) FILTER (WHERE me.status = 'request')::int AS requests
         FROM conversation_members me
         JOIN conversations c ON c.id = me.conversation_id
        WHERE me.user_id = $1 AND c.last_message_at IS NOT NULL`,
      [userId],
    );
    return result.rows[0];
  }

  async searchPeople(
    viewerId: string,
    text: string,
    limit: number,
  ): Promise<MessageablePerson[]> {
    const pattern = `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    const result = await this.pool.query<{
      id: string;
      username: string;
      first_name: string;
      last_name: string;
      profile_photo_url: string | null;
      is_friend: boolean;
    }>(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.profile_photo_url,
              (f.requester_id IS NOT NULL) AS is_friend
         FROM users u
         LEFT JOIN friendships f
           ON f.status = 'accepted'
          AND LEAST(f.requester_id, f.addressee_id) = LEAST(u.id, $1::uuid)
          AND GREATEST(f.requester_id, f.addressee_id) = GREATEST(u.id, $1::uuid)
        WHERE u.id <> $1
          -- Only people you're allowed to reach: friends, or people open to anyone
          AND (f.requester_id IS NOT NULL OR u.message_privacy = 'anyone')
          AND (u.username ILIKE $2
               OR u.first_name ILIKE $2
               OR u.last_name ILIKE $2
               OR (u.first_name || ' ' || u.last_name) ILIKE $2)
        ORDER BY (f.requester_id IS NOT NULL) DESC, u.first_name, u.last_name
        LIMIT $3`,
      [viewerId, pattern, limit],
    );
    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      profilePhotoUrl: row.profile_photo_url,
      isFriend: row.is_friend,
    }));
  }

  // ---------------------------------------------------------------- Chats

  async createDirect(creatorId: string, other: NewMember): Promise<string> {
    return await this.inTransaction(async (client) => {
      const created = await client.query<{ id: string }>(
        `INSERT INTO conversations (kind, direct_key, created_by)
         VALUES ('direct', $1, $2)
         ON CONFLICT (direct_key) DO NOTHING
         RETURNING id`,
        [directKey(creatorId, other.userId), creatorId],
      );
      // Someone started the same chat a moment ago: use theirs
      if (!created.rows[0]) {
        const existing = await client.query<{ id: string }>(
          "SELECT id FROM conversations WHERE direct_key = $1",
          [directKey(creatorId, other.userId)],
        );
        return existing.rows[0].id;
      }

      const id = created.rows[0].id;
      await client.query(
        `INSERT INTO conversation_members (conversation_id, user_id, status, added_by)
         VALUES ($1, $2, 'accepted', $2), ($1, $3, $4, $2)`,
        [id, creatorId, other.userId, other.status],
      );
      return id;
    });
  }

  async createGroup(
    creatorId: string,
    name: string | null,
    members: NewMember[],
  ): Promise<string> {
    return await this.inTransaction(async (client) => {
      const created = await client.query<{ id: string }>(
        `INSERT INTO conversations (kind, name, created_by)
         VALUES ('group', $1, $2)
         RETURNING id`,
        [name, creatorId],
      );
      const id = created.rows[0].id;
      await client.query(
        `INSERT INTO conversation_members (conversation_id, user_id, status, role, added_by)
         VALUES ($1, $2, 'accepted', 'admin', $2)`,
        [id, creatorId],
      );
      await this.insertMembers(client, id, creatorId, members);
      return id;
    });
  }

  async addMembers(
    conversationId: string,
    addedBy: string,
    members: NewMember[],
  ): Promise<void> {
    await this.inTransaction(async (client) => {
      await this.insertMembers(client, conversationId, addedBy, members);
    });
  }

  // One by one, so each person's joined_at keeps the order they were added in
  private async insertMembers(
    client: PoolClient,
    conversationId: string,
    addedBy: string,
    members: NewMember[],
  ) {
    for (const member of members) {
      await client.query(
        `INSERT INTO conversation_members (conversation_id, user_id, status, role, added_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (conversation_id, user_id) DO UPDATE
           -- Someone who declined or left before is in (or asked) again
           SET status = EXCLUDED.status, role = EXCLUDED.role, added_by = EXCLUDED.added_by,
               archived = false, last_read_at = NULL, left_at = NULL,
               joined_at = clock_timestamp()
         WHERE conversation_members.status IN ('declined', 'left', 'removed')`,
        [
          conversationId,
          member.userId,
          member.status,
          member.role ?? "member",
          addedBy,
        ],
      );
    }
  }

  async removeMember(conversationId: string, userId: string): Promise<void> {
    await this.pool.query(
      "DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2",
      [conversationId, userId],
    );
  }

  async markLeft(
    conversationId: string,
    userId: string,
    status: "left" | "removed",
  ): Promise<void> {
    await this.pool.query(
      `UPDATE conversation_members
          SET status = $3, left_at = clock_timestamp(), role = 'member', archived = false
        WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, status],
    );
  }

  async setStatus(
    conversationId: string,
    userId: string,
    status: MemberStatus,
  ): Promise<void> {
    // Accepting means you've looked at it: everything so far counts as seen
    await this.pool.query(
      `UPDATE conversation_members
          SET status = $3,
              archived = false,
              last_read_at = CASE WHEN $3 = 'accepted' THEN clock_timestamp() ELSE last_read_at END
        WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, status],
    );
  }

  async setArchived(
    conversationId: string,
    userId: string,
    archived: boolean,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE conversation_members SET archived = $3
        WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, archived],
    );
  }

  async setRole(
    conversationId: string,
    userId: string,
    role: GroupRole,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE conversation_members SET role = $3
        WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, role],
    );
  }

  async promoteLongestIfNoAdmin(
    conversationId: string,
  ): Promise<string | null> {
    const result = await this.pool.query<{ user_id: string }>(
      `UPDATE conversation_members SET role = 'admin'
        WHERE conversation_id = $1
          AND user_id = (SELECT user_id FROM conversation_members
                          WHERE conversation_id = $1 AND status = 'accepted'
                          ORDER BY joined_at LIMIT 1)
          AND NOT EXISTS (SELECT 1 FROM conversation_members
                           WHERE conversation_id = $1 AND status = 'accepted' AND role = 'admin')
        RETURNING user_id`,
      [conversationId],
    );
    return result.rows[0]?.user_id ?? null;
  }

  async rename(conversationId: string, name: string | null): Promise<void> {
    await this.pool.query("UPDATE conversations SET name = $2 WHERE id = $1", [
      conversationId,
      name,
    ]);
  }

  async setPhoto(
    conversationId: string,
    photo: SavedPhoto | null,
  ): Promise<string | null> {
    const result = await this.pool.query<{ old_key: string | null }>(
      `UPDATE conversations c
          SET photo_url = $2, photo_key = $3
         FROM (SELECT photo_key FROM conversations WHERE id = $1) old
        WHERE c.id = $1
        RETURNING old.photo_key AS old_key`,
      [conversationId, photo?.url ?? null, photo?.storageKey ?? null],
    );
    return result.rows[0]?.old_key ?? null;
  }

  async markRead(conversationId: string, userId: string): Promise<Date> {
    const result = await this.pool.query<{ last_read_at: Date }>(
      `UPDATE conversation_members SET last_read_at = clock_timestamp()
        WHERE conversation_id = $1 AND user_id = $2
        RETURNING last_read_at`,
      [conversationId, userId],
    );
    return result.rows[0].last_read_at;
  }

  async acceptDirectRequests(userA: string, userB: string): Promise<string[]> {
    const result = await this.pool.query<{ conversation_id: string }>(
      `UPDATE conversation_members cm SET status = 'accepted'
         FROM conversations c
        WHERE c.id = cm.conversation_id AND c.direct_key = $1 AND cm.status = 'request'
        RETURNING cm.conversation_id`,
      [directKey(userA, userB)],
    );
    return result.rows.map((row) => row.conversation_id);
  }

  // ---------------------------------------------------------------- Messages

  async addMessage(message: NewMessage): Promise<Message> {
    const id = await this.inTransaction(async (client) => {
      const created = await client.query<{ id: string; created_at: Date }>(
        `INSERT INTO messages (conversation_id, sender_id, kind, body, event, target_user_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, created_at`,
        [
          message.conversationId,
          message.senderId,
          message.event ? "system" : "text",
          message.body ?? "",
          message.event ?? null,
          message.targetUserId ?? null,
        ],
      );
      const { id, created_at } = created.rows[0];

      const photos = message.photos ?? [];
      for (const [position, photo] of photos.entries()) {
        await client.query(
          `INSERT INTO message_photos (message_id, url, storage_key, position)
           VALUES ($1, $2, $3, $4)`,
          [id, photo.url, photo.storageKey, position],
        );
      }

      await client.query(
        "UPDATE conversations SET last_message_at = $2 WHERE id = $1",
        [message.conversationId, created_at],
      );
      // A new text brings the chat back from the archive (for the ones who accepted it)
      if (!message.event) {
        await client.query(
          `UPDATE conversation_members SET archived = false
            WHERE conversation_id = $1 AND status = 'accepted' AND archived`,
          [message.conversationId],
        );
      }
      // You've seen your own message
      await client.query(
        `UPDATE conversation_members SET last_read_at = $3
          WHERE conversation_id = $1 AND user_id = $2 AND status = 'accepted'`,
        [message.conversationId, message.senderId, created_at],
      );
      return id;
    });

    return await this.requireMessage(id);
  }

  async findMessage(
    conversationId: string,
    messageId: string,
  ): Promise<Message | null> {
    const result = await this.pool.query<MessageRow>(
      `${MESSAGE_SELECT} WHERE m.id = $1 AND m.conversation_id = $2`,
      [messageId, conversationId],
    );
    const row = result.rows[0];
    return row ? toMessage(row) : null;
  }

  async listMessages(
    conversationId: string,
    cursor: MessageCursor | null,
    limit: number,
    until: Date | null,
  ): Promise<MessagePage> {
    const result = await this.pool.query<MessageRow>(
      `${MESSAGE_SELECT}
        WHERE m.conversation_id = $1
          AND ($5::timestamptz IS NULL OR m.created_at <= $5::timestamptz)
          AND ($2::timestamptz IS NULL OR (m.created_at, m.id) < ($2::timestamptz, $3::uuid))
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT $4`,
      [
        conversationId,
        cursor?.createdAt ?? null,
        cursor?.id ?? null,
        limit + 1,
        until,
      ],
    );
    const rows = result.rows.slice(0, limit);
    const last = rows[rows.length - 1];
    return {
      messages: rows.map(toMessage),
      next:
        result.rows.length > limit && last
          ? { createdAt: last.created_at_text, id: last.id }
          : null,
    };
  }

  async editMessage(messageId: string, body: string): Promise<Message> {
    await this.pool.query(
      "UPDATE messages SET body = $2, edited_at = clock_timestamp() WHERE id = $1",
      [messageId, body],
    );
    return await this.requireMessage(messageId);
  }

  async unsendMessage(messageId: string) {
    const photoKeys = await this.inTransaction(async (client) => {
      const photos = await client.query<{ storage_key: string }>(
        "DELETE FROM message_photos WHERE message_id = $1 RETURNING storage_key",
        [messageId],
      );
      await client.query(
        "UPDATE messages SET body = '', unsent_at = clock_timestamp() WHERE id = $1",
        [messageId],
      );
      return photos.rows.map((row) => row.storage_key);
    });
    return { message: await this.requireMessage(messageId), photoKeys };
  }

  // ---------------------------------------------------------------- Helpers

  private async requireMessage(id: string): Promise<Message> {
    const result = await this.pool.query<MessageRow>(
      `${MESSAGE_SELECT} WHERE m.id = $1`,
      [id],
    );
    return toMessage(result.rows[0]);
  }

  private async inTransaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK"); // undo everything since BEGIN
      throw error;
    } finally {
      client.release();
    }
  }
}

// Someone else never learns that you declined: to them it's still waiting
function toMember(row: MemberRow, viewerId: string): ConversationMember {
  const status =
    row.status === "declined" && row.id !== viewerId ? "request" : row.status;
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url,
    status,
    role: row.role,
    joinedAt: row.joined_at,
    lastReadAt: row.last_read_at,
  };
}
