import type { GroupRole } from "@memories/shared";
import type {
  Conversation,
  ConversationFolder,
  Message,
  MessageablePerson,
  MessageCounts,
} from "../../domain/conversation";
import { request } from "./http";

const BASE = "/conversations";

export interface MessagePage {
  messages: Message[]; // newest first
  nextCursor: string | null; // null = nothing older
}

export async function listConversations(
  folder: ConversationFolder,
): Promise<Conversation[]> {
  const data = await request<{ conversations: Conversation[] }>(
    `${BASE}?folder=${folder}`,
  );
  return data.conversations;
}

export async function getMessageCounts(): Promise<MessageCounts> {
  return await request<MessageCounts>(`${BASE}/counts`);
}

export async function searchPeopleToMessage(
  text: string,
  signal?: AbortSignal,
): Promise<MessageablePerson[]> {
  const params = new URLSearchParams({ q: text });
  const data = await request<{ people: MessageablePerson[] }>(
    `${BASE}/people?${params}`,
    { signal },
  );
  return data.people;
}

export async function getConversation(id: string): Promise<Conversation> {
  const data = await request<{ conversation: Conversation }>(`${BASE}/${id}`);
  return data.conversation;
}

export async function startDirectChat(userId: string): Promise<Conversation> {
  const data = await request<{ conversation: Conversation }>(`${BASE}/direct`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return data.conversation;
}

export async function createGroup(
  name: string,
  memberIds: string[],
): Promise<Conversation> {
  const data = await request<{ conversation: Conversation }>(`${BASE}/groups`, {
    method: "POST",
    body: JSON.stringify({ name, memberIds }),
  });
  return data.conversation;
}

export async function listMessages(
  id: string,
  cursor: string | null,
): Promise<MessagePage> {
  const params = cursor ? `?${new URLSearchParams({ cursor })}` : "";
  return await request<MessagePage>(`${BASE}/${id}/messages${params}`);
}

export async function sendMessage(
  id: string,
  body: string,
  photos: File[],
): Promise<Message> {
  const form = new FormData();
  form.append("body", body);
  for (const photo of photos) form.append("photos", photo);
  const data = await request<{ message: Message }>(`${BASE}/${id}/messages`, {
    method: "POST",
    body: form,
  });
  return data.message;
}

export async function editMessage(
  id: string,
  messageId: string,
  body: string,
): Promise<Message> {
  const data = await request<{ message: Message }>(
    `${BASE}/${id}/messages/${messageId}`,
    { method: "PATCH", body: JSON.stringify({ body }) },
  );
  return data.message;
}

export async function unsendMessage(
  id: string,
  messageId: string,
): Promise<Message> {
  const data = await request<{ message: Message }>(
    `${BASE}/${id}/messages/${messageId}`,
    { method: "DELETE" },
  );
  return data.message;
}

export async function markConversationRead(id: string): Promise<string | null> {
  const data = await request<{ lastReadAt: string | null }>(
    `${BASE}/${id}/read`,
    { method: "POST" },
  );
  return data.lastReadAt;
}

export async function acceptConversation(id: string): Promise<void> {
  await request<void>(`${BASE}/${id}/accept`, { method: "POST" });
}

export async function declineConversation(id: string): Promise<void> {
  await request<void>(`${BASE}/${id}/decline`, { method: "POST" });
}

export async function setArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  await request<void>(`${BASE}/${id}/archive`, {
    method: archived ? "PUT" : "DELETE",
  });
}

export async function addGroupMembers(
  id: string,
  memberIds: string[],
): Promise<void> {
  await request<void>(`${BASE}/${id}/members`, {
    method: "POST",
    body: JSON.stringify({ memberIds }),
  });
}

// Your own id = leave the group
export async function removeGroupMember(
  id: string,
  userId: string,
): Promise<void> {
  await request<void>(`${BASE}/${id}/members/${userId}`, { method: "DELETE" });
}

export async function setMemberRole(
  id: string,
  userId: string,
  role: GroupRole,
): Promise<void> {
  await request<void>(`${BASE}/${id}/members/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

export async function renameGroup(id: string, name: string): Promise<void> {
  await request<void>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function setGroupPhoto(
  id: string,
  photo: File | null,
): Promise<void> {
  if (!photo) {
    await request<void>(`${BASE}/${id}/photo`, { method: "DELETE" });
    return;
  }
  const form = new FormData();
  form.append("photo", photo);
  await request<void>(`${BASE}/${id}/photo`, { method: "PUT", body: form });
}
