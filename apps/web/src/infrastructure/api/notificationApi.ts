import type { AppNotification } from "../../domain/notification";
import { request } from "./http";

export interface NotificationPage {
  notifications: AppNotification[];
  nextCursor: string | null; // null = no older notifications
}

export async function listNotifications(
  cursor: string | null,
): Promise<NotificationPage> {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);
  return await request<NotificationPage>(`/notifications?${params}`);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const data = await request<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await request<void>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<void>("/notifications/read-all", { method: "POST" });
}
