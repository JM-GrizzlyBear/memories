import type {
  Conversation,
  ConversationMember,
  Message,
} from "../../domain/conversation";

// The logged-in person in these tests
export const ME = "me";

export const AT = "2026-10-17T00:00:00Z";

export function person(
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
    joinedAt: AT,
    lastReadAt: null,
  };
}

// A text message from me; tests change only what they need
export function message(overrides: Partial<Message> = {}): Message {
  return {
    id: "m",
    conversationId: "c",
    sender: person(ME, "Me"),
    kind: "text",
    body: "",
    event: null,
    target: null,
    photos: [],
    createdAt: AT,
    editedAt: null,
    unsentAt: null,
    ...overrides,
  };
}

// A group with only me in it; tests change only what they need
export function chat(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "c",
    kind: "group",
    name: null,
    photoUrl: null,
    createdAt: AT,
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
