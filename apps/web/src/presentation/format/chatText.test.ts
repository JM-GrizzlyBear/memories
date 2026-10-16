import { describe, expect, it } from "vitest";
import type {
  Conversation,
  ConversationMember,
  Message,
} from "../../domain/conversation";
import {
  conversationTitle,
  groupSizeText,
  previewText,
  systemText,
} from "./chatText";

const ME = "me";

function person(
  id: string,
  firstName: string,
  status: ConversationMember["status"] = "accepted",
): ConversationMember {
  return {
    id,
    username: firstName.toLowerCase(),
    firstName,
    lastName: "Test",
    profilePhotoUrl: null,
    status,
    role: "member",
    joinedAt: "2026-10-17T00:00:00Z",
    lastReadAt: null,
  };
}

function message(overrides: Partial<Message>): Message {
  return {
    id: "m",
    conversationId: "c",
    sender: person(ME, "Me"),
    kind: "text",
    body: "",
    event: null,
    target: null,
    photos: [],
    createdAt: "2026-10-17T00:00:00Z",
    editedAt: null,
    unsentAt: null,
    ...overrides,
  };
}

function chat(overrides: Partial<Conversation>): Conversation {
  return {
    id: "c",
    kind: "group",
    name: null,
    photoUrl: null,
    createdAt: "2026-10-17T00:00:00Z",
    lastMessageAt: null,
    members: [person(ME, "Me")],
    lastMessage: null,
    me: {
      status: "accepted",
      role: "member",
      archived: false,
      lastReadAt: null,
      addedBy: null,
    },
    unread: false,
    ...overrides,
  };
}

describe("chat names", () => {
  it("a direct chat is the other person's name", () => {
    expect(
      conversationTitle(
        chat({
          kind: "direct",
          members: [person(ME, "Me"), person("a", "Ana")],
        }),
        ME,
      ),
    ).toBe("Ana Test");
  });

  it("a group uses its name, or the people in it", () => {
    expect(conversationTitle(chat({ name: "Crew" }), ME)).toBe("Crew");
    const members = [person(ME, "Me"), person("a", "Ana"), person("b", "Ben")];
    expect(conversationTitle(chat({ members }), ME)).toBe("Ana, Ben");
    const many = [...members, person("c", "Cara"), person("d", "Dana")];
    expect(conversationTitle(chat({ members: many }), ME)).toBe(
      "Ana, Ben and 2 others",
    );
  });

  it("group size counts invited people", () => {
    const members = [
      person(ME, "Me"),
      person("a", "Ana"),
      person("c", "Cara", "request"),
    ];
    expect(groupSizeText(chat({ members }))).toBe("3 people · 1 invited");
  });
});

describe("system lines", () => {
  const ana = person("a", "Ana");
  const ben = person("b", "Ben");

  it("say who did what, with You for me", () => {
    expect(
      systemText(
        message({ kind: "system", event: "added", sender: ana, target: ben }),
        ME,
      ),
    ).toBe("Ana added Ben");
    expect(
      systemText(
        message({
          kind: "system",
          event: "added",
          sender: ana,
          target: person(ME, "Me"),
        }),
        ME,
      ),
    ).toBe("Ana added you");
    expect(systemText(message({ kind: "system", event: "left" }), ME)).toBe(
      "You left the group",
    );
  });

  it("an admin handed over by itself reads naturally", () => {
    expect(
      systemText(
        message({
          kind: "system",
          event: "role_admin",
          sender: ana,
          target: ana,
        }),
        ME,
      ),
    ).toBe("Ana is now an admin");
  });
});

describe("the preview line in the list", () => {
  it("shows who wrote it in groups, and You for me", () => {
    const fromAna = message({ body: "Hello", sender: person("a", "Ana") });
    expect(previewText(chat({ lastMessage: fromAna }), ME)).toBe("Ana: Hello");
    expect(
      previewText(chat({ kind: "direct", lastMessage: fromAna }), ME),
    ).toBe("Hello");
    expect(
      previewText(
        chat({ kind: "direct", lastMessage: message({ body: "Hi" }) }),
        ME,
      ),
    ).toBe("You: Hi");
  });

  it("photos and unsent messages", () => {
    const photos = message({
      photos: [
        { id: "p1", url: "", position: 0 },
        { id: "p2", url: "", position: 1 },
      ],
    });
    expect(previewText(chat({ lastMessage: photos }), ME)).toBe(
      "You sent 2 photos",
    );
    expect(
      previewText(
        chat({ lastMessage: message({ unsentAt: "2026-10-17T00:00:00Z" }) }),
        ME,
      ),
    ).toBe("You unsent a message");
  });
});
