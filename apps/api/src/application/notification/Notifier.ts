import type { NewNotification } from "../../domain/notification/Notification.js";
import type { NotificationRepository } from "../../domain/notification/NotificationRepository.js";
import type { RealtimePublisher } from "../ports/RealtimePublisher.js";

export const NOTIFICATION_EVENT = "notification";

// Saves a notification and pushes it to the person's open tabs.
// A failure here never breaks the action that caused it (a like still counts).
export class Notifier {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly realtime: RealtimePublisher,
  ) {}

  async notify(input: NewNotification): Promise<void> {
    if (input.recipientId === input.actorId) return; // no notifications about yourself

    try {
      const id = await this.notifications.save(input);
      const view = await this.notifications.findView(id);
      if (view)
        this.realtime.publish(input.recipientId, NOTIFICATION_EVENT, view);
    } catch (error) {
      console.error("Couldn't send a notification", error);
    }
  }

  async withdrawLike(actorId: string, memoryId: string): Promise<void> {
    try {
      await this.notifications.deleteLike(actorId, memoryId);
    } catch (error) {
      console.error("Couldn't remove a like notification", error);
    }
  }
}
