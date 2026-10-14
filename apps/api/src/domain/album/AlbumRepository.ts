import type { AlbumYear } from "./Album.js";

export interface AlbumRepository {
  // The owner's memories that the viewer may see, grouped by the year they happened
  findYears(ownerId: string, viewerId: string): Promise<AlbumYear[]>;
  // null removes the line
  saveNote(userId: string, year: number, note: string | null): Promise<void>;
}
