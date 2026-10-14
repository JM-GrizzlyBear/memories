import type { GroupRole } from "@memories/shared";
import type { UserSummary } from "./friendship";

export type ConversationKind = "direct" | "group";

// accepted = in my chats; request = waiting for me to accept; declined = in my archive
export type MemberStatus = "accepted" | "request" | "declined";

export type ConversationFolder = "inbox" | "requests" | "archive";

export type MessageEvent =
  | "created"
  | "added"
  | "joined"
  | "removed"
  | "left"
  | "renamed"
  | "photo_changed"
  | "photo_removed"
  | "role_admin"
  | "role_moderator"
  | "role_member";

export interface ConversationMember extends UserSummary {
  status: MemberStatus;
  role: GroupRole;
  joinedAt: string;
  lastReadAt: string | null; // everything up to here has been seen
}

export interface MessagePhoto {
  id: string;
  url: string;
  position: number;
}

// As the API sends it (JSON dates are strings)
export interface Message {
  id: string;
  conversationId: string;
  sender: UserSummary | null;
  kind: "text" | "system";
  body: string;
  event: MessageEvent | null;
  target: UserSummary | null;
  photos: MessagePhoto[];
  createdAt: string;
  editedAt: string | null;
  unsentAt: string | null;
}

export interface Conversation {
  id: string;
  kind: ConversationKind;
  name: string | null;
  photoUrl: string | null;
  createdAt: string;
  lastMessageAt: string | null;
  members: ConversationMember[];
  lastMessage: Message | null;
  me: {
    status: MemberStatus;
    role: GroupRole;
    archived: boolean;
    lastReadAt: string | null;
    addedBy: UserSummary | null; // who added me to a group
  };
  unread: boolean;
}

export interface MessageablePerson extends UserSummary {
  isFriend: boolean; // false = they get a request first
}

export interface MessageCounts {
  unread: number; // chats with something new
  requests: number;
}
