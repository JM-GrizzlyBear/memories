import type { UserSummary } from "../../domain/friendship";
import type {
  Conversation,
  ConversationMember,
  Message,
} from "../../domain/conversation";

function firstName(person: UserSummary | null, myId: string) {
  if (!person) return "Someone";
  return person.id === myId ? "You" : person.firstName;
}

export function fullName(person: Pick<UserSummary, "firstName" | "lastName">) {
  return `${person.firstName} ${person.lastName}`;
}

// The other person in a direct chat
export function otherMember(
  conversation: Conversation,
  myId: string,
): ConversationMember | null {
  return conversation.members.find((member) => member.id !== myId) ?? null;
}

// Direct: their name. Group: its name, or the people in it ("Ana, Ben and 3 others")
export function conversationTitle(conversation: Conversation, myId: string) {
  if (conversation.kind === "direct") {
    const other = otherMember(conversation, myId);
    return other ? fullName(other) : "Chat";
  }
  if (conversation.name) return conversation.name;

  const names = conversation.members
    .filter((member) => member.id !== myId && member.status === "accepted")
    .map((member) => member.firstName);
  if (names.length === 0) return "Just you";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} others`;
}

// "Ana added Ben", "You left the group"...
export function systemText(message: Message, myId: string) {
  const actor = firstName(message.sender, myId);
  const target = firstName(message.target, myId);
  const targetLower = target === "You" ? "you" : target;

  switch (message.event) {
    case "created":
      return `${actor} created the group`;
    case "added":
      return `${actor} added ${targetLower}`;
    case "joined":
      return `${actor} joined the group`;
    case "removed":
      return `${actor} removed ${targetLower}`;
    case "left":
      return `${actor} left the group`;
    case "renamed":
      return message.body
        ? `${actor} named the group “${message.body}”`
        : `${actor} removed the group name`;
    case "photo_changed":
      return `${actor} changed the group photo`;
    case "photo_removed":
      return `${actor} removed the group photo`;
    case "role_admin":
      // Handed over by itself when the last admin left
      return message.sender?.id === message.target?.id
        ? `${target} ${target === "You" ? "are" : "is"} now an admin`
        : `${actor} made ${targetLower} an admin`;
    case "role_moderator":
      return `${actor} made ${targetLower} a moderator`;
    case "role_member":
      return `${actor} made ${targetLower} a member`;
    default:
      return "";
  }
}

export function unsentText(message: Message, myId: string) {
  return `${firstName(message.sender, myId)} unsent a message`;
}

function photoText(count: number) {
  return count === 1 ? "sent a photo" : `sent ${count} photos`;
}

// The grey line under a chat's name in the list
export function previewText(conversation: Conversation, myId: string) {
  const message = conversation.lastMessage;
  if (!message) return "";
  if (message.kind === "system") return systemText(message, myId);
  if (message.unsentAt) return unsentText(message, myId);

  const who = firstName(message.sender, myId);
  const showWho = who === "You" || conversation.kind === "group";
  if (!message.body) return `${who} ${photoText(message.photos.length)}`;
  return showWho ? `${who}: ${message.body}` : message.body;
}

// For the list: "3:42 PM" today, "Mon" this week, "Oct 6", or "Oct 6, 2025"
export function shortTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const days = (now.getTime() - date.getTime()) / 86_400_000;
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (days < 6) return date.toLocaleDateString("en-US", { weekday: "short" });
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Between messages when time has passed: "Today, 3:42 PM", "Mon, 9:10 AM", "Oct 6, 3:42 PM"
export function separatorTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  const days = (now.getTime() - date.getTime()) / 86_400_000;
  if (days < 6) {
    return `${date.toLocaleDateString("en-US", { weekday: "long" })}, ${time}`;
  }
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
  return `${day}, ${time}`;
}

// Everyone in a group, invited ones included ("3 people · 1 invited")
export function groupSize(conversation: Conversation) {
  return conversation.members.filter((member) => member.status !== "declined")
    .length;
}

export function groupSizeText(conversation: Conversation) {
  const total = groupSize(conversation);
  const invited = conversation.members.filter(
    (member) => member.status === "request",
  ).length;
  const people = `${total} ${total === 1 ? "person" : "people"}`;
  return invited > 0 ? `${people} · ${invited} invited` : people;
}

export function roleLabel(role: ConversationMember["role"]) {
  return role === "admin" ? "Admin" : role === "moderator" ? "Moderator" : null;
}
