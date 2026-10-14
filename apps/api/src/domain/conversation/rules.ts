import { MESSAGE_LIMITS, type GroupRole } from "@memories/shared";
import type { Message } from "./Conversation.js";

// Admins can remove anyone; moderators only members; members nobody
export function canRemoveMember(actor: GroupRole, target: GroupRole) {
  if (actor === "admin") return true;
  if (actor === "moderator") return target === "member";
  return false;
}

// Only admins make admins and moderators (or take it back)
export function canSetRoles(actor: GroupRole) {
  return actor === "admin";
}

// Your own text, not unsent, within the first 22 minutes
export function canEditMessage(
  message: Message,
  userId: string,
  now = new Date(),
) {
  if (message.kind !== "text" || message.unsentAt) return false;
  if (message.sender?.id !== userId) return false;
  const ageMs = now.getTime() - message.createdAt.getTime();
  return ageMs <= MESSAGE_LIMITS.editMinutes * 60 * 1000;
}

export function canUnsendMessage(message: Message, userId: string) {
  return (
    message.kind === "text" &&
    !message.unsentAt &&
    message.sender?.id === userId
  );
}

// The key that makes two people share one direct chat, whoever starts it
export function directKey(userA: string, userB: string) {
  return userA < userB ? `${userA}:${userB}` : `${userB}:${userA}`;
}
