import type { Pool } from "pg";
import type {
  Memory,
  MemoryPhoto,
  Visibility,
} from "../../domain/memory/Memory.js";
import type {
  MemoryRepository,
  NewMemory,
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
}
