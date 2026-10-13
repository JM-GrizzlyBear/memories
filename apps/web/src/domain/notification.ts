import type { UserSummary } from "./friendship";

export type NotificationType =
  | "friend_request" // someone asked to be my friend
  | "friend_accepted" // someone accepted my request
  | "memory_liked" // someone liked my memory
  | "memory_commented"; // someone commented on my memory

// As the API sends it (JSON dates are strings)
export interface AppNotification {
  id: string;
  type: NotificationType;
  actor: UserSummary;
  memory: { id: string; title: string; coverUrl: string | null } | null;
  commentPreview: string | null;
  isRead: boolean;
  createdAt: string;
  // false when what it points to is gone (request cancelled, memory or comment deleted)
  isAvailable: boolean;
}
