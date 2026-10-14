import type { Pool } from "pg";
import type { AlbumMemory, AlbumYear } from "../../domain/album/Album.js";
import type { AlbumRepository } from "../../domain/album/AlbumRepository.js";
import { VISIBLE_TO_VIEWER } from "./PostgresMemoryRepository.js";

interface AlbumYearRow {
  year: number;
  memory_count: number;
  note: string | null;
  memories: AlbumMemory[]; // built as JSON by Postgres
}

export class PostgresAlbumRepository implements AlbumRepository {
  constructor(private readonly pool: Pool) {}

  async findYears(ownerId: string, viewerId: string): Promise<AlbumYear[]> {
    // $1 = viewer (used by VISIBLE_TO_VIEWER), $2 = the album's owner
    const result = await this.pool.query<AlbumYearRow>(
      `WITH visible AS (
         SELECT m.id, m.title, m.memory_date, m.visibility, m.created_at,
                EXTRACT(YEAR FROM m.memory_date)::int AS year,
                (SELECT p.url FROM memory_photos p
                  WHERE p.memory_id = m.id ORDER BY p.position LIMIT 1) AS cover_url
           FROM memories m
          WHERE m.user_id = $2 AND ${VISIBLE_TO_VIEWER}
       )
       SELECT v.year,
              count(*)::int AS memory_count,
              (SELECT n.note FROM album_year_notes n
                WHERE n.user_id = $2 AND n.year = v.year) AS note,
              json_agg(
                json_build_object(
                  'id', v.id,
                  'title', v.title,
                  'memoryDate', v.memory_date,
                  'coverUrl', v.cover_url,
                  'visibility', v.visibility
                )
                ORDER BY v.memory_date DESC, v.created_at DESC
              ) AS memories
         FROM visible v
        GROUP BY v.year
        ORDER BY v.year DESC`,
      [viewerId, ownerId],
    );

    return result.rows.map((row) => ({
      year: row.year,
      memoryCount: row.memory_count,
      note: row.note,
      memories: row.memories,
    }));
  }

  async saveNote(
    userId: string,
    year: number,
    note: string | null,
  ): Promise<void> {
    if (note === null) {
      await this.pool.query(
        "DELETE FROM album_year_notes WHERE user_id = $1 AND year = $2",
        [userId, year],
      );
      return;
    }

    await this.pool.query(
      `INSERT INTO album_year_notes (user_id, year, note)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, year)
       DO UPDATE SET note = EXCLUDED.note, updated_at = now()`,
      [userId, year, note],
    );
  }
}
