import type { GroupRole } from "@memories/shared";
import type { UserSummary } from "../user/User.js";

export type ConversationKind = "direct" | "group";

// How one person sees a chat:
//   accepted = in their chats; request = waiting for them to accept;
//   declined = they said no (it sits in their archive)
export type MemberStatus = "accepted" | "request" | "declined";

export type ConversationFolder = "inbox" | "requests" | "archive";

// What a system line in a group says happened
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
  joinedAt: Date;
  lastReadAt: Date | null;
}

export interface MessagePhoto {
  id: string;
  url: string;
  position: number;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: UserSummary | null; // null when the account was deleted
  kind: "text" | "system";
  body: string; // "" once unsent
  event: MessageEvent | null; // system lines only
  target: UserSummary | null; // who a system line is about
  photos: MessagePhoto[];
  createdAt: Date;
  editedAt: Date | null;
  unsentAt: Date | null;
}

// My own place in a chat
export interface Membership {
  conversationId: string;
  kind: ConversationKind;
  userId: string;
  status: MemberStatus;
  role: GroupRole;
  archived: boolean;
  joinedAt: Date;
}

export interface Conversation {
  id: string;
  kind: ConversationKind;
  name: string | null;
  photoUrl: string | null;
  createdAt: Date;
  lastMessageAt: Date | null;
  members: ConversationMember[]; // everyone except the ones who declined a group
  lastMessage: Message | null;
  me: {
    status: MemberStatus;
    role: GroupRole;
    archived: boolean;
    lastReadAt: Date | null;
    addedBy: UserSummary | null; // who added me (groups, or who started a direct chat)
  };
  unread: boolean;
}

// Someone you could message or add to a group
export interface MessageablePerson extends UserSummary {
  isFriend: boolean; // false = they'll get a request first
}
