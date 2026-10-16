import { describe, expect, it } from "vitest";
import { SetAlbumNote } from "../../src/application/album/SetAlbumNote.js";
import type { AlbumRepository } from "../../src/domain/album/AlbumRepository.js";
import { InvalidAlbumYearError } from "../../src/domain/album/errors.js";

// A fake repository that only remembers what it was asked to save
function fakeAlbums() {
  const saved: { userId: string; year: number; note: string | null }[] = [];
  const repository: AlbumRepository = {
    findYears: async () => [],
    saveNote: async (userId, year, note) => {
      saved.push({ userId, year, note });
    },
  };
  return { repository, saved };
}

describe("SetAlbumNote", () => {
  it("saves a line about a year", async () => {
    const { repository, saved } = fakeAlbums();
    const result = await new SetAlbumNote(repository).execute({
      userId: "u1",
      year: 2024,
      note: "Cold mountains, warm friends.",
    });
    expect(result).toEqual({
      year: 2024,
      note: "Cold mountains, warm friends.",
    });
    expect(saved).toEqual([
      { userId: "u1", year: 2024, note: "Cold mountains, warm friends." },
    ]);
  });

  it("an empty line removes it", async () => {
    const { repository, saved } = fakeAlbums();
    await new SetAlbumNote(repository).execute({
      userId: "u1",
      year: 2024,
      note: "",
    });
    expect(saved[0].note).toBeNull();
  });

  it("refuses years that can't be in the album", async () => {
    const { repository, saved } = fakeAlbums();
    const useCase = new SetAlbumNote(repository);
    await expect(
      useCase.execute({ userId: "u1", year: 1800, note: "x" }),
    ).rejects.toThrow(InvalidAlbumYearError);
    await expect(
      useCase.execute({ userId: "u1", year: 3000, note: "x" }),
    ).rejects.toThrow(InvalidAlbumYearError);
    expect(saved).toEqual([]);
  });
});
