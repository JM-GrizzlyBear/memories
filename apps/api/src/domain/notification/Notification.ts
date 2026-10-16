import type { UserSummary } from "../user/User.js";

export const NOTIFICATION_TYPES = [
  "friend_request", // someone asked to be my friend
  "friend_accepted", // someone accepted my request
  "memory_liked", // someone liked my memory
  "memory_commented", // someone commented on my memory
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NewNotification {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  memoryId?: string | null;
  commentId?: string | null;
}

// A notification as the app shows it
export interface NotificationView {
  id: string;
  type: NotificationType;
  actor: UserSummary;
  memory: { id: string; title: string; coverUrl: string | null } | null;
  commentPreview: string | null;
  isRead: boolean;
  createdAt: Date;
  // false when what it points to is gone: the request was cancelled,
  // the memory or comment was deleted, or we're no longer friends
  isAvailable: boolean;
}
