import type {
  NotificationCursor,
  NotificationRepository,
} from "../../domain/notification/NotificationRepository.js";

export interface ListNotificationsInput {
  recipientId: string;
  limit: number;
  after: NotificationCursor | null;
}

export class ListNotifications {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute({ recipientId, limit, after }: ListNotificationsInput) {
    // Ask for one extra: if it comes back, there's an older page
    const items = await this.notifications.list(recipientId, limit + 1, after);
    const page = items.slice(0, limit);
    const hasMore = items.length > limit;
    return {
      notifications: page.map((item) => item.notification),
      nextCursor: hasMore ? page[page.length - 1].cursor : null,
    };
  }
}
