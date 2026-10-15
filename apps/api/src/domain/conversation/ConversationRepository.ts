import type { GroupRole } from "@memories/shared";
import type {
  Conversation,
  ConversationFolder,
  MemberStatus,
  Membership,
  Message,
  MessageEvent,
  MessageablePerson,
} from "./Conversation.js";

// A photo already saved by the photo storage
export interface SavedPhoto {
  url: string;
  storageKey: string;
}

export interface NewMember {
  userId: string;
  status: MemberStatus;
  role?: GroupRole;
}

export interface NewMessage {
  conversationId: string;
  senderId: string;
  body?: string;
  photos?: SavedPhoto[];
  event?: MessageEvent; // a system line instead of a text
  targetUserId?: string | null;
}

export interface MessageCursor {
  createdAt: string; // exact timestamp text from Postgres
  id: string;
}

export interface MessagePage {
  messages: Message[]; // newest first
  next: MessageCursor | null;
}

export interface ConversationRepository {
  // --- Reading ---
  list(
    viewerId: string,
    folder: ConversationFolder,
    limit: number,
  ): Promise<Conversation[]>;
  get(conversationId: string, viewerId: string): Promise<Conversation | null>;
  findMembership(
    conversationId: string,
    userId: string,
  ): Promise<Membership | null>;
  // Who's in it now (and gets its live updates): not the ones who left or were removed
  memberIds(conversationId: string): Promise<string[]>;
  countMembers(conversationId: string): Promise<number>; // in it now, or invited
  findDirect(userA: string, userB: string): Promise<string | null>;
  counts(userId: string): Promise<{ unread: number; requests: number }>;
  searchPeople(
    viewerId: string,
    text: string,
    limit: number,
  ): Promise<MessageablePerson[]>;

  // --- Chats ---
  createDirect(creatorId: string, other: NewMember): Promise<string>;
  createGroup(
    creatorId: string,
    name: string | null,
    members: NewMember[],
  ): Promise<string>;
  addMembers(
    conversationId: string,
    addedBy: string,
    members: NewMember[],
  ): Promise<void>;
  // Gone completely (someone turning down a group invite)
  removeMember(conversationId: string, userId: string): Promise<void>;
  // Out of the group, but the chat stays theirs to read up to now
  markLeft(
    conversationId: string,
    userId: string,
    status: "left" | "removed",
  ): Promise<void>;
  setStatus(
    conversationId: string,
    userId: string,
    status: MemberStatus,
  ): Promise<void>;
  setArchived(
    conversationId: string,
    userId: string,
    archived: boolean,
  ): Promise<void>;
  setRole(
    conversationId: string,
    userId: string,
    role: GroupRole,
  ): Promise<void>;
  // No admin left among the people in it: the one who's been there longest becomes admin
  promoteLongestIfNoAdmin(conversationId: string): Promise<string | null>;
  rename(conversationId: string, name: string | null): Promise<void>;
  // Returns the old photo's storage key, to delete the file
  setPhoto(
    conversationId: string,
    photo: SavedPhoto | null,
  ): Promise<string | null>;
  // Everything until now is seen; returns when
  markRead(conversationId: string, userId: string): Promise<Date>;
  // Pending direct requests between two people who just became friends; returns the chats changed
  acceptDirectRequests(userA: string, userB: string): Promise<string[]>;

  // --- Messages ---
  addMessage(message: NewMessage): Promise<Message>;
  findMessage(
    conversationId: string,
    messageId: string,
  ): Promise<Message | null>;
  // `until`: someone who left only sees what was sent before they left
  listMessages(
    conversationId: string,
    cursor: MessageCursor | null,
    limit: number,
    until: Date | null,
  ): Promise<MessagePage>;
  editMessage(messageId: string, body: string): Promise<Message>;
  // Returns the storage keys of its photos, to delete the files
  unsendMessage(
    messageId: string,
  ): Promise<{ message: Message; photoKeys: string[] }>;
}
