import { describe, expect, it } from "vitest";
import { USERS } from "./support/seed.js";
import { JPG, useTestApp } from "./support/testApp.js";

const t = useTestApp();

type Agent = Awaited<ReturnType<typeof t.as>>;

async function keepMemory(
  agent: Agent,
  title: string,
  visibility: "public" | "friends" | "private",
) {
  const response = await agent
    .post("/api/memories")
    .field("title", title)
    .field("story", "A day to remember.")
    .field("memoryDate", "2024-05-14")
    .field("visibility", visibility)
    .attach("photos", JPG, {
      filename: "photo.jpg",
      contentType: "image/jpeg",
    });
  expect(response.status).toBe(201);
  return response.body.memory as { id: string; title: string };
}

async function journalTitles(agent: Agent) {
  const response = await agent.get("/api/memories?limit=20");
  expect(response.status).toBe(200);
  return (response.body.memories as { title: string }[]).map(
    (memory) => memory.title,
  );
}

describe("keeping a memory", () => {
  it("needs at least one photo", async () => {
    const maria = await t.as("maria");
    const response = await maria
      .post("/api/memories")
      .field("title", "No photos")
      .field("story", "Oops")
      .field("memoryDate", "2024-05-14")
      .field("visibility", "public");
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty("photos");
  });

  it("refuses a file that isn't really a photo", async () => {
    const maria = await t.as("maria");
    const response = await maria
      .post("/api/memories")
      .field("title", "Fake")
      .field("story", "Not a photo")
      .field("memoryDate", "2024-05-14")
      .field("visibility", "public")
      .attach("photos", Buffer.from("MZ this is not a jpg"), {
        filename: "virus.jpg",
        contentType: "image/jpeg",
      });
    expect(response.status).toBe(400);
  });
});

describe("who can see a memory", () => {
  it("follows Everyone / Friends / Only me", async () => {
    const maria = await t.as("maria");
    await keepMemory(maria, "For everyone", "public");
    await keepMemory(maria, "For friends", "friends");
    await keepMemory(maria, "Just me", "private");

    // Ana is Maria's friend; Cara isn't
    const ana = await t.as("ana");
    const cara = await t.as("cara");
    expect(await journalTitles(maria)).toEqual(
      expect.arrayContaining(["For everyone", "For friends", "Just me"]),
    );
    expect(await journalTitles(ana)).toEqual(
      expect.arrayContaining(["For everyone", "For friends"]),
    );
    expect(await journalTitles(ana)).not.toContain("Just me");
    expect(await journalTitles(cara)).toContain("For everyone");
    expect(await journalTitles(cara)).not.toContain("For friends");
  });

  it("a memory you can't see is 404, so nobody learns it exists", async () => {
    const maria = await t.as("maria");
    const secret = await keepMemory(maria, "For friends", "friends");
    const cara = await t.as("cara");
    expect((await cara.get(`/api/memories/${secret.id}`)).status).toBe(404);
  });

  it("unfriending hides the friends memories again", async () => {
    const maria = await t.as("maria");
    await keepMemory(maria, "For friends", "friends");
    const ana = await t.as("ana");
    expect(await journalTitles(ana)).toContain("For friends");

    expect((await ana.delete(`/api/friends/${USERS.maria.id}`)).ok).toBe(true);
    expect(await journalTitles(ana)).not.toContain("For friends");
  });
});

describe("changing a memory", () => {
  it("only the owner can edit or delete it", async () => {
    const maria = await t.as("maria");
    const memory = await keepMemory(maria, "Public one", "public");
    const ana = await t.as("ana");

    // A complete, valid edit: refused only because Ana isn't the owner
    const edit = await ana
      .patch(`/api/memories/${memory.id}`)
      .field("title", "Hacked")
      .field("story", "Not mine")
      .field("memoryDate", "2024-05-14")
      .field("visibility", "public")
      .field("photoOrder", JSON.stringify([{ kind: "new", index: 0 }]))
      .attach("photos", JPG, {
        filename: "photo.jpg",
        contentType: "image/jpeg",
      });
    expect(edit.status).toBe(403);
    expect((await ana.delete(`/api/memories/${memory.id}`)).status).toBe(403);

    expect((await maria.delete(`/api/memories/${memory.id}`)).ok).toBe(true);
    expect((await maria.get(`/api/memories/${memory.id}`)).status).toBe(404);
  });
});

describe("likes and comments", () => {
  it("a friend likes and comments, and the owner is notified", async () => {
    const maria = await t.as("maria");
    const memory = await keepMemory(maria, "Graduation", "friends");
    const ana = await t.as("ana");

    expect((await ana.put(`/api/memories/${memory.id}/like`)).status).toBe(200);
    const comment = await ana
      .post(`/api/memories/${memory.id}/comments`)
      .send({ body: "What a day!" });
    expect(comment.status).toBe(201);

    const fresh = await maria.get(`/api/memories/${memory.id}`);
    expect(fresh.body.memory).toMatchObject({ likeCount: 1, commentCount: 1 });

    const notifications = await maria.get("/api/notifications");
    const types = (notifications.body.notifications as { type: string }[]).map(
      (n) => n.type,
    );
    expect(types).toEqual(
      expect.arrayContaining(["memory_liked", "memory_commented"]),
    );
  });

  it("someone who can't see the memory can't like it either", async () => {
    const maria = await t.as("maria");
    const memory = await keepMemory(maria, "Graduation", "friends");
    const cara = await t.as("cara");
    expect((await cara.put(`/api/memories/${memory.id}/like`)).status).toBe(
      404,
    );
  });
});
