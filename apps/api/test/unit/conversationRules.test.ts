import { afterEach, describe, expect, it, vi } from "vitest";
import type { Message } from "../../src/domain/conversation/Conversation.js";
import {
  canEditMessage,
  canRemoveMember,
  canSetRoles,
  canUnsendMessage,
  directKey,
} from "../../src/domain/conversation/rules.js";

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: "m1",
    conversationId: "c1",
    sender: {
      id: "me",
      username: "me",
      firstName: "Me",
      lastName: "Too",
      profilePhotoUrl: null,
    },
    kind: "text",
    body: "hello",
    event: null,
    target: null,
    photos: [],
    createdAt: new Date("2026-10-17T10:00:00Z"),
    editedAt: null,
    unsentAt: null,
    ...overrides,
  };
}

describe("group roles", () => {
  it("admins remove anyone", () => {
    expect(canRemoveMember("admin", "admin")).toBe(true);
    expect(canRemoveMember("admin", "moderator")).toBe(true);
    expect(canRemoveMember("admin", "member")).toBe(true);
  });

  it("moderators remove only members", () => {
    expect(canRemoveMember("moderator", "member")).toBe(true);
    expect(canRemoveMember("moderator", "moderator")).toBe(false);
    expect(canRemoveMember("moderator", "admin")).toBe(false);
  });

  it("members remove nobody", () => {
    expect(canRemoveMember("member", "member")).toBe(false);
  });

  it("only admins change roles", () => {
    expect(canSetRoles("admin")).toBe(true);
    expect(canSetRoles("moderator")).toBe(false);
    expect(canSetRoles("member")).toBe(false);
  });
});

describe("editing a message", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const sentAt = new Date("2026-10-17T10:00:00Z");

  it("works for your own text within 22 minutes", () => {
    const at = new Date(sentAt.getTime() + 22 * 60_000);
    expect(canEditMessage(message(), "me", at)).toBe(true);
  });

  it("stops after 22 minutes", () => {
    const at = new Date(sentAt.getTime() + 22 * 60_000 + 1);
    expect(canEditMessage(message(), "me", at)).toBe(false);
  });

  it("never works on someone else's, an unsent one, or a system line", () => {
    expect(canEditMessage(message(), "someone else", sentAt)).toBe(false);
    expect(canEditMessage(message({ unsentAt: sentAt }), "me", sentAt)).toBe(
      false,
    );
    expect(
      canEditMessage(
        message({ kind: "system", event: "created" }),
        "me",
        sentAt,
      ),
    ).toBe(false);
  });
});

describe("unsending a message", () => {
  it("works on your own message at any time", () => {
    expect(canUnsendMessage(message(), "me")).toBe(true);
  });

  it("not on someone else's, or twice", () => {
    expect(canUnsendMessage(message(), "someone else")).toBe(false);
    expect(canUnsendMessage(message({ unsentAt: new Date() }), "me")).toBe(
      false,
    );
  });
});

describe("direct chat key", () => {
  it("is the same whoever starts the chat", () => {
    expect(directKey("aaa", "bbb")).toBe(directKey("bbb", "aaa"));
    expect(directKey("aaa", "bbb")).toBe("aaa:bbb");
  });
});
