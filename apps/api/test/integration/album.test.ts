import { describe, expect, it } from "vitest";
import { JPG, useTestApp } from "./support/testApp.js";

const t = useTestApp();

describe("album", () => {
  it("groups the memories you can see by year, newest first, with the owner's line", async () => {
    const maria = await t.as("maria");
    for (const [title, date, visibility] of [
      ["Graduation", "2024-06-21", "public"],
      ["Moving day", "2025-11-30", "public"],
      ["Diary", "2025-02-14", "private"],
    ] as const) {
      await maria
        .post("/api/memories")
        .field("title", title)
        .field("story", "x")
        .field("memoryDate", date)
        .field("visibility", visibility)
        .attach("photos", JPG, {
          filename: "p.jpg",
          contentType: "image/jpeg",
        });
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
