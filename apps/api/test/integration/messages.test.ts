import { describe, expect, it } from "vitest";
import { USERS } from "./support/seed.js";
import { JPG, useTestApp } from "./support/testApp.js";

const t = useTestApp();

type Agent = Awaited<ReturnType<typeof t.as>>;

async function openChat(agent: Agent, userId: string) {
  const response = await agent
    .post("/api/conversations/direct")
    .send({ userId });
  return response;
}

async function send(agent: Agent, conversationId: string, body: string) {
  return await agent
    .post(`/api/conversations/${conversationId}/messages`)
    .field("body", body);
}

async function folder(agent: Agent, name: "inbox" | "requests" | "archive") {
  const response = await agent.get(`/api/conversations?folder=${name}`);
  return (response.body.conversations as { id: string }[]).map((c) => c.id);
}

async function member(agent: Agent, conversationId: string, username: string) {
  const response = await agent.get(`/api/conversations/${conversationId}`);
  return (
    response.body.conversation.members as {
      username: string;
      status: string;
      role: string;
      lastReadAt: string | null;
    }[]
  ).find((m) => m.username === username);
}

describe("who can message whom", () => {
  it("friends can message each other right away", async () => {
    const maria = await t.as("maria");
    const chat = await openChat(maria, USERS.ana.id);
    expect(chat.status).toBe(200);
    expect(
      (await send(maria, chat.body.conversation.id, "Hi Ana!")).status,
    ).toBe(201);

    const ana = await t.as("ana");
    expect(await folder(ana, "inbox")).toContain(chat.body.conversation.id);
  });

  it("a stranger can't message someone set to Friends (the default)", async () => {
    const cara = await t.as("cara");
    expect((await openChat(cara, USERS.maria.id)).status).toBe(403);
    expect((await cara.get("/api/users/maria")).body.profile.canMessage).toBe(
      false,
    );
  });

  it("…but can when they choose Anyone, and it arrives as a request", async () => {
    const maria = await t.as("maria");
    expect(
      (
        await maria
          .put("/api/account/privacy")
          .send({ messagePrivacy: "anyone" })
      ).status,
    ).toBe(200);

    const cara = await t.as("cara");
    expect((await cara.get("/api/users/maria")).body.profile.canMessage).toBe(
      true,
    );
    const chat = await openChat(cara, USERS.maria.id);
    const id = chat.body.conversation.id;
    await send(cara, id, "Hi Maria!");

    expect(await folder(maria, "requests")).toEqual([id]);
    expect(await folder(maria, "inbox")).not.toContain(id);
    // She can read it, but not reply before accepting
    const messages = await maria.get(`/api/conversations/${id}/messages`);
    expect(messages.body.messages[0].body).toBe("Hi Maria!");
    expect((await send(maria, id, "hey")).status).toBe(403);
  });
});

describe("message requests", () => {
  async function requestFromCara() {
    const maria = await t.as("maria");
    await maria.put("/api/account/privacy").send({ messagePrivacy: "anyone" });
    const cara = await t.as("cara");
    const id = (await openChat(cara, USERS.maria.id)).body.conversation
      .id as string;
    await send(cara, id, "Hi Maria!");
    return { maria, cara, id };
  }

  it("reading a request doesn't count as seen; accepting does", async () => {
    const { maria, cara, id } = await requestFromCara();
    await maria.post(`/api/conversations/${id}/read`);
    expect((await member(cara, id, "maria"))?.lastReadAt).toBeNull();

    expect((await maria.post(`/api/conversations/${id}/accept`)).status).toBe(
      204,
    );
    expect((await member(cara, id, "maria"))?.lastReadAt).not.toBeNull();
    expect(await folder(maria, "inbox")).toContain(id);
  });

  it("declining moves it to the archive, and the sender never finds out", async () => {
    const { maria, cara, id } = await requestFromCara();
    expect((await maria.post(`/api/conversations/${id}/decline`)).status).toBe(
      204,
    );
    expect(await folder(maria, "archive")).toContain(id);
    // To Cara it still looks like it's waiting
    expect((await member(cara, id, "maria"))?.status).toBe("request");
    // She can still accept it later
    expect((await maria.post(`/api/conversations/${id}/accept`)).status).toBe(
      204,
    );
    expect(await folder(maria, "inbox")).toContain(id);
  });

  it("becoming friends accepts the request by itself", async () => {
    const { maria, cara, id } = await requestFromCara();
    await cara.post(`/api/friends/requests/${USERS.maria.id}`);
    await maria.post(`/api/friends/requests/${USERS.cara.id}/accept`);
    expect(await folder(maria, "inbox")).toContain(id);
  });
});

describe("editing and unsending", () => {
  async function chatWithAna() {
    const maria = await t.as("maria");
    const id = (await openChat(maria, USERS.ana.id)).body.conversation
      .id as string;
    const sent = await send(maria, id, "Hi Ana");
    return { maria, id, messageId: sent.body.message.id as string };
  }

  it("you can edit your text for 22 minutes", async () => {
    const { maria, id, messageId } = await chatWithAna();
    const edited = await maria
      .patch(`/api/conversations/${id}/messages/${messageId}`)
      .send({ body: "Hi Ana!!" });
    expect(edited.status).toBe(200);
    expect(edited.body.message.editedAt).not.toBeNull();

    await t.sql(
      "UPDATE messages SET created_at = now() - interval '23 minutes' WHERE id = $1",
      [messageId],
    );
    const late = await maria
      .patch(`/api/conversations/${id}/messages/${messageId}`)
      .send({ body: "too late" });
    expect(late.status).toBe(403);
  });

  it("only your own messages", async () => {
    const { id, messageId } = await chatWithAna();
    const ana = await t.as("ana");
    expect(
      (
        await ana
          .patch(`/api/conversations/${id}/messages/${messageId}`)
          .send({ body: "x" })
      ).status,
    ).toBe(403);
    expect(
      (await ana.delete(`/api/conversations/${id}/messages/${messageId}`))
        .status,
    ).toBe(403);
  });

  it("unsending keeps a trace and removes the photos", async () => {
    const { maria, id } = await chatWithAna();
    const withPhoto = await maria
      .post(`/api/conversations/${id}/messages`)
      .field("body", "look")
      .attach("photos", JPG, { filename: "a.jpg", contentType: "image/jpeg" });
    expect(withPhoto.body.message.photos).toHaveLength(1);

    const unsent = await maria.delete(
      `/api/conversations/${id}/messages/${withPhoto.body.message.id}`,
    );
    expect(unsent.body.message).toMatchObject({ body: "", photos: [] });
    expect(unsent.body.message.unsentAt).not.toBeNull();
  });

  it("an empty message is refused", async () => {
    const { maria, id } = await chatWithAna();
    expect((await send(maria, id, "   ")).status).toBe(400);
  });
});

describe("groups", () => {
  async function group(memberIds: string[]) {
    const maria = await t.as("maria");
    const response = await maria
      .post("/api/conversations/groups")
      .send({ name: "Crew", memberIds });
    return { maria, response, id: response.body.conversation?.id as string };
  }

  it("needs 3 people or more, you included", async () => {
    const { response } = await group([USERS.ana.id]);
    expect(response.status).toBe(400);
  });

  it("the creator is admin; friends join right away", async () => {
    const { maria, response, id } = await group([USERS.ana.id, USERS.ben.id]);
    expect(response.status).toBe(201);
    expect((await member(maria, id, "maria"))?.role).toBe("admin");
    expect((await member(maria, id, "ana"))?.status).toBe("accepted");
  });

  it("you can't add someone who only takes messages from friends", async () => {
    const { maria, id } = await group([USERS.ana.id, USERS.ben.id]);
    // Cara isn't Maria's friend and is set to Friends
    const add = await maria
      .post(`/api/conversations/${id}/members`)
      .send({ memberIds: [USERS.cara.id] });
    expect(add.status).toBe(403);
  });

  it("roles: moderators remove members only; only admins change roles", async () => {
    const { maria, id } = await group([USERS.ana.id, USERS.ben.id]);
    const ana = await t.as("ana");

    expect(
      (
        await ana
          .put(`/api/conversations/${id}/members/${USERS.ben.id}/role`)
          .send({ role: "moderator" })
      ).status,
    ).toBe(403);
    expect(
      (
        await maria
          .put(`/api/conversations/${id}/members/${USERS.ana.id}/role`)
          .send({ role: "moderator" })
      ).status,
    ).toBe(204);
    expect(
      (await ana.delete(`/api/conversations/${id}/members/${USERS.maria.id}`))
        .status,
    ).toBe(403);
    expect(
      (await ana.delete(`/api/conversations/${id}/members/${USERS.ben.id}`))
        .status,
    ).toBe(204);
  });

  it("leaving keeps the chat for you, up to when you left", async () => {
    const { maria, id } = await group([USERS.ana.id, USERS.ben.id]);
    const ana = await t.as("ana");
    await send(maria, id, "before");
    expect(
      (await ana.delete(`/api/conversations/${id}/members/${USERS.ana.id}`))
        .status,
    ).toBe(204);
    await send(maria, id, "after");

    expect(await folder(ana, "inbox")).toContain(id);
    const messages = await ana.get(`/api/conversations/${id}/messages`);
    const bodies = (messages.body.messages as { body: string }[]).map(
      (m) => m.body,
    );
    expect(bodies).toContain("before");
    expect(bodies).not.toContain("after");
    expect((await send(ana, id, "can I still talk?")).status).toBe(403);
  });

  it("when the last admin leaves, the longest member takes over", async () => {
    const { maria, id } = await group([USERS.ana.id, USERS.ben.id]);
    await maria.delete(`/api/conversations/${id}/members/${USERS.maria.id}`);
    const ana = await t.as("ana");
    expect((await member(ana, id, "ana"))?.role).toBe("admin");
  });

  it("a group can shrink below 3 and stay a group", async () => {
    const { maria, id } = await group([USERS.ana.id, USERS.ben.id]);
    expect(
      (await maria.delete(`/api/conversations/${id}/members/${USERS.ben.id}`))
        .status,
    ).toBe(204);
    const chat = await maria.get(`/api/conversations/${id}`);
    expect(chat.body.conversation.kind).toBe("group");
  });
});
