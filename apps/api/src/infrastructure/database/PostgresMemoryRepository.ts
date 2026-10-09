import type { Pool } from "pg";
import type {
  Memory,
  MemoryPhoto,
  MemoryWithAuthor,
  Visibility,
} from "../../domain/memory/Memory.js";
import type {
  JournalItem,
  JournalQuery,
  MemoryRepository,
  MemoryUpdate,
  NewMemory,
  StoredMemoryPhoto,
} from "../../domain/memory/MemoryRepository.js";

interface MemoryRow {
  id: string;
  user_id: string;
  title: string;
  story: string;
  memory_date: string; // DATE comes back as "YYYY-MM-DD" (see pool.ts)
  location: string | null;
  visibility: Visibility;
  created_at: Date;
  updated_at: Date;
}

interface MemoryWithAuthorRow extends MemoryRow {
  created_at_text: string; // exact timestamp, used for the cursor
  username: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  photos: MemoryPhoto[]; // built as JSON by Postgres
}

function toMemory(row: MemoryRow, photos: MemoryPhoto[]): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    story: row.story,
    memoryDate: new Date(`${row.memory_date}T00:00:00Z`),
    location: row.location,
    visibility: row.visibility,
    photos,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Send DATE values as plain "YYYY-MM-DD", so time zones can't shift the day
function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

// One memory with its author and photos (cover first). Used by the journal and the viewer.
const SELECT_MEMORY_WITH_AUTHOR = `
  SELECT
    m.*,
    m.created_at::text AS created_at_text,
    u.username, u.first_name, u.last_name, u.profile_photo_url,
    COALESCE(
      (SELECT json_agg(
                json_build_object('id', p.id, 'url', p.url, 'position', p.position)
                ORDER BY p.position)
         FROM memory_photos p
        WHERE p.memory_id = m.id),
      '[]'::json
    ) AS photos
  FROM memories m
  JOIN users u ON u.id = m.user_id`;

function toMemoryWithAuthor(row: MemoryWithAuthorRow): MemoryWithAuthor {
  return {
    ...toMemory(row, row.photos),
    author: {
      id: row.user_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      profilePhotoUrl: row.profile_photo_url,
    },
  };
}

export class PostgresMemoryRepository implements MemoryRepository {
  constructor(private readonly pool: Pool) {}

  async create(memory: NewMemory): Promise<Memory> {
    // One connection for the whole transaction
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const memoryResult = await client.query<MemoryRow>(
        `INSERT INTO memories (user_id, title, story, memory_date, location, visibility)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          memory.userId,
          memory.title,
          memory.story,
          toDateOnly(memory.memoryDate),
          memory.location,
          memory.visibility,
        ],
      );
      const row = memoryResult.rows[0];

      const photos: MemoryPhoto[] = [];
      for (const photo of memory.photos) {
        const photoResult = await client.query<MemoryPhoto>(
          `INSERT INTO memory_photos (memory_id, url, storage_key, position)
           VALUES ($1, $2, $3, $4)
           RETURNING id, url, position`,
          [row.id, photo.url, photo.storageKey, photo.position],
        );
        photos.push(photoResult.rows[0]);
      }

      await client.query("COMMIT");
      return toMemory(row, photos);
    } catch (error) {
      await client.query("ROLLBACK"); // undo everything from BEGIN
      throw error;
    } finally {
      client.release(); // always give the connection back to the pool
    }
  }

  async findJournal({
    viewerId,
    limit,
    after,
  }: JournalQuery): Promise<JournalItem[]> {
    // Keep this WHERE in sync with canView() in the domain
    const result = await this.pool.query<MemoryWithAuthorRow>(
      `${SELECT_MEMORY_WITH_AUTHOR}
     WHERE (m.user_id = $1 OR m.visibility = 'public')
       AND ($2::timestamptz IS NULL OR (m.created_at, m.id) < ($2::timestamptz, $3::uuid))
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT $4`,
      [viewerId, after?.createdAt ?? null, after?.id ?? null, limit],
    );

    return result.rows.map((row) => ({
      memory: toMemoryWithAuthor(row),
      cursor: { createdAt: row.created_at_text, id: row.id },
    }));
  }

  async findById(id: string): Promise<MemoryWithAuthor | null> {
    const result = await this.pool.query<MemoryWithAuthorRow>(
      `${SELECT_MEMORY_WITH_AUTHOR}
     WHERE m.id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toMemoryWithAuthor(row) : null;
  }

  async findPhotoFiles(memoryId: string): Promise<StoredMemoryPhoto[]> {
    const result = await this.pool.query<{
      id: string;
      url: string;
      storage_key: string;
    }>(
      `SELECT id, url, storage_key
       FROM memory_photos
      WHERE memory_id = $1
      ORDER BY position`,
      [memoryId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      url: row.url,
      storageKey: row.storage_key,
    }));
  }

  async update(memoryId: string, changes: MemoryUpdate): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE memories
          SET title = $2, story = $3, memory_date = $4, location = $5, visibility = $6,
              updated_at = now()
        WHERE id = $1`,
        [
          memoryId,
          changes.title,
          changes.story,
          toDateOnly(changes.memoryDate),
          changes.location,
          changes.visibility,
        ],
      );

      // Replace the photo rows instead of moving them: swapping two positions one by one
      // would briefly break UNIQUE (memory_id, position)
      await client.query("DELETE FROM memory_photos WHERE memory_id = $1", [
        memoryId,
      ]);
      for (const photo of changes.photos) {
        await client.query(
          `INSERT INTO memory_photos (memory_id, url, storage_key, position)
         VALUES ($1, $2, $3, $4)`,
          [memoryId, photo.url, photo.storageKey, photo.position],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(memoryId: string): Promise<void> {
    await this.pool.query("DELETE FROM memories WHERE id = $1", [memoryId]);
  }
}
