import type { Message } from "../../src/domain/conversation/Conversation.js";

export const SENT_AT = new Date("2026-10-17T10:00:00Z");

// A text message "me" sent at SENT_AT; tests change only what they need
export function message(overrides: Partial<Message> = {}): Message {
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
    createdAt: SENT_AT,
    editedAt: null,
    unsentAt: null,
    ...overrides,
  };
}
