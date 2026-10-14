import type { AlbumRepository } from "../../domain/album/AlbumRepository.js";
import { InvalidAlbumYearError } from "../../domain/album/errors.js";

export interface SetAlbumNoteInput {
  userId: string;
  year: number;
  note: string; // already trimmed and checked by albumNoteSchema; "" removes it
}

// Your own line about one year of your album
export class SetAlbumNote {
  constructor(private readonly albums: AlbumRepository) {}

  async execute({ userId, year, note }: SetAlbumNoteInput) {
    const nextYear = new Date().getUTCFullYear() + 1;
    if (!Number.isInteger(year) || year < 1900 || year > nextYear) {
      throw new InvalidAlbumYearError();
    }

    const saved = note === "" ? null : note;
    await this.albums.saveNote(userId, year, saved);
    return { year, note: saved };
  }
}
