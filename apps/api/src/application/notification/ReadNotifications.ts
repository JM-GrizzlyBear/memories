import type { NotificationRepository } from "../../domain/notification/NotificationRepository.js";

// The unread count, and marking notifications as read (only your own)
export class ReadNotifications {
  constructor(private readonly notifications: NotificationRepository) {}

  countUnread(recipientId: string) {
    return this.notifications.countUnread(recipientId);
  }

  markRead(recipientId: string, id: string) {
    return this.notifications.markRead(recipientId, id);
  }

  markAllRead(recipientId: string) {
    return this.notifications.markAllRead(recipientId);
  }
}
