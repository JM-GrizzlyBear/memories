import type { Pool } from "pg";
import type {
  Friend,
  FriendRequest,
  Friendship,
  FriendshipStatus,
  UserSearchResult,
} from "../../domain/friendship/Friendship.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";

interface FriendshipRow {
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: Date;
  accepted_at: Date | null;
}

interface UserSummaryRow {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
}

function toSummary(row: UserSummaryRow) {
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url,
  };
}

// Matches the row between two people in either direction (uses uniq_friendships_pair)
const PAIR = `LEAST(f.requester_id, f.addressee_id) = LEAST($1::uuid, $2::uuid)
          AND GREATEST(f.requester_id, f.addressee_id) = GREATEST($1::uuid, $2::uuid)`;

// In LIKE, % and _ are wildcards: escape them so a search for "a_b" means exactly "a_b"
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export class PostgresFriendshipRepository implements FriendshipRepository {
  constructor(private readonly pool: Pool) {}

  async findBetween(userA: string, userB: string): Promise<Friendship | null> {
    const result = await this.pool.query<FriendshipRow>(
      `SELECT * FROM friendships f WHERE ${PAIR}`,
      [userA, userB],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      requesterId: row.requester_id,
      addresseeId: row.addressee_id,
      status: row.status,
      createdAt: row.created_at,
      acceptedAt: row.accepted_at,
    };
  }

  async areFriends(userA: string, userB: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM friendships f WHERE ${PAIR} AND f.status = 'accepted'`,
      [userA, userB],
    );
    return result.rowCount === 1;
  }

  async createRequest(requesterId: string, addresseeId: string) {
    // Two people clicking "Add friend" at the same moment: the second insert is skipped
    await this.pool.query(
      `INSERT INTO friendships (requester_id, addressee_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [requesterId, addresseeId],
    );
  }

  async accept(requesterId: string, addresseeId: string) {
    const result = await this.pool.query(
      `UPDATE friendships
          SET status = 'accepted', accepted_at = now()
        WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending'`,
      [requesterId, addresseeId],
    );
    return result.rowCount === 1;
  }

  async deletePending(requesterId: string, addresseeId: string) {
    const result = await this.pool.query(
      `DELETE FROM friendships
        WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending'`,
      [requesterId, addresseeId],
    );
    return result.rowCount === 1;
  }

  async deleteAccepted(userA: string, userB: string) {
    const result = await this.pool.query(
      `DELETE FROM friendships f WHERE ${PAIR} AND f.status = 'accepted'`,
      [userA, userB],
    );
    return result.rowCount === 1;
  }

  async listFriends(userId: string): Promise<Friend[]> {
    const result = await this.pool.query<
      UserSummaryRow & { friends_since: Date }
    >(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.profile_photo_url,
              f.accepted_at AS friends_since
         FROM friendships f
         JOIN users u
           ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
        WHERE (f.requester_id = $1 OR f.addressee_id = $1)
          AND f.status = 'accepted'
        ORDER BY u.first_name, u.last_name`,
      [userId],
    );
    return result.rows.map((row) => ({
      ...toSummary(row),
      friendsSince: row.friends_since,
    }));
  }

  async listIncoming(userId: string): Promise<FriendRequest[]> {
    const result = await this.pool.query<
      UserSummaryRow & { requested_at: Date }
    >(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.profile_photo_url,
              f.created_at AS requested_at
         FROM friendships f
         JOIN users u ON u.id = f.requester_id
        WHERE f.addressee_id = $1 AND f.status = 'pending'
        ORDER BY f.created_at DESC`,
      [userId],
    );
    return result.rows.map((row) => ({
      ...toSummary(row),
      requestedAt: row.requested_at,
    }));
  }

  async listOutgoing(userId: string): Promise<FriendRequest[]> {
    const result = await this.pool.query<
      UserSummaryRow & { requested_at: Date }
    >(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.profile_photo_url,
              f.created_at AS requested_at
         FROM friendships f
         JOIN users u ON u.id = f.addressee_id
        WHERE f.requester_id = $1 AND f.status = 'pending'
        ORDER BY f.created_at DESC`,
      [userId],
    );
    return result.rows.map((row) => ({
      ...toSummary(row),
      requestedAt: row.requested_at,
    }));
  }

  async countFriends(userId: string) {
    const result = await this.pool.query<{ count: string }>(
      `SELECT count(*) FROM friendships
        WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'`,
      [userId],
    );
    return Number(result.rows[0].count); // count() comes back as a string
  }

  async searchUsers(
    viewerId: string,
    text: string,
    limit: number,
  ): Promise<UserSearchResult[]> {
    const pattern = `%${escapeLike(text)}%`;
    const result = await this.pool.query<
      UserSummaryRow & { friendship: FriendshipStatus }
    >(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.profile_photo_url,
              CASE
                WHEN f.requester_id IS NULL THEN 'none'
                WHEN f.status = 'accepted' THEN 'friends'
                WHEN f.requester_id = $1 THEN 'request_sent'
                ELSE 'request_received'
              END AS friendship
         FROM users u
         LEFT JOIN friendships f
           ON LEAST(f.requester_id, f.addressee_id) = LEAST(u.id, $1::uuid)
          AND GREATEST(f.requester_id, f.addressee_id) = GREATEST(u.id, $1::uuid)
        WHERE u.id <> $1
          AND (u.username ILIKE $2
               OR u.first_name ILIKE $2
               OR u.last_name ILIKE $2
               OR (u.first_name || ' ' || u.last_name) ILIKE $2)
        ORDER BY (f.status = 'accepted') IS TRUE DESC, u.first_name, u.last_name
        LIMIT $3`,
      [viewerId, pattern, limit],
    );
    return result.rows.map((row) => ({
      ...toSummary(row),
      friendship: row.friendship,
    }));
  }
}
