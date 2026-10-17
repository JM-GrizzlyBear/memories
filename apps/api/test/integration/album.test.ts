import { describe, expect, it } from "vitest";
import { ALBUM_MEMORIES } from "../fixtures/memories.js";
import { JPG, JPG_FILE } from "../fixtures/photos.js";
import { withMemoryFields } from "./support/forms.js";
import { useTestApp } from "./support/testApp.js";

const t = useTestApp();

describe("album", () => {
  it("groups the memories you can see by year, newest first, with the owner's line", async () => {
    const maria = await t.as("maria");
    for (const fields of ALBUM_MEMORIES) {
      await withMemoryFields(maria.post("/api/memories"), fields).attach(
        "photos",
        JPG,
        JPG_FILE,
      );
    }
    await maria.put("/api/album/notes/2025").send({ note: "A big year." });

    const mine = await maria.get("/api/album/maria");
    expect(
      mine.body.album.years.map((y: { year: number; memoryCount: number }) => [
        y.year,
        y.memoryCount,
      ]),
    ).toEqual([
      [2025, 2],
      [2024, 1],
    ]);
    expect(mine.body.album.years[0].note).toBe("A big year.");

    // Cara isn't a friend: no private diary for her
    const cara = await t.as("cara");
    const theirs = await cara.get("/api/album/maria");
    expect(theirs.body.album.years[0].memoryCount).toBe(1);
  });
});
