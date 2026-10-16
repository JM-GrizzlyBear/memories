import type { NewNotification, NotificationView } from "./Notification.js";

// A bookmark in the list: the exact created_at text from Postgres + the id
export interface NotificationCursor {
  createdAt: string;
  id: string;
}

export interface NotificationPageItem {
  notification: NotificationView;
  cursor: NotificationCursor;
}

export interface NotificationRepository {
  // Saves it (or brings an existing grouped one back to the top, unread) and returns its id
  save(notification: NewNotification): Promise<string>;
  findView(id: string): Promise<NotificationView | null>;
  // Taking back a like takes back its notification
  deleteLike(actorId: string, memoryId: string): Promise<void>;
  list(
    recipientId: string,
    limit: number,
    after: NotificationCursor | null,
  ): Promise<NotificationPageItem[]>;
  countUnread(recipientId: string): Promise<number>;
  markRead(recipientId: string, id: string): Promise<void>;
  markAllRead(recipientId: string): Promise<void>;
}
