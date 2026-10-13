import { Link } from "react-router";
import { useMarkNotificationRead } from "../../../application/notification/useNotifications";
import type { AppNotification } from "../../../domain/notification";
import { timeAgo } from "../../format/dates";
import { describeNotification } from "../../format/notificationText";
import { Avatar } from "../user/Avatar";

// One row: who, what, when. Opening it marks it as read.
export function NotificationItem({
  notification,
}: {
  notification: AppNotification;
}) {
  const markRead = useMarkNotificationRead();
  const { name, action, href } = describeNotification(notification);
  const isUnread = !notification.isRead;

  return (
    <li>
      <Link
        to={href}
        onClick={() => {
          if (isUnread) markRead.mutate(notification.id);
        }}
        className={`flex items-center gap-3 rounded-md px-3 py-3 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-neutral-900 sm:px-4 ${
          isUnread ? "bg-white" : ""
        }`}
      >
        <Avatar user={notification.actor} size="md" />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm leading-snug ${isUnread ? "" : "text-neutral-600"}`}
          >
            <span className="font-semibold text-ink">{name}</span> {action}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            <time dateTime={notification.createdAt}>
              {timeAgo(notification.createdAt)}
            </time>
            {!notification.isAvailable && " · No longer available"}
          </p>
        </div>
        {notification.memory?.coverUrl && notification.isAvailable && (
          <img
            src={notification.memory.coverUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded object-cover"
          />
        )}
        {isUnread && (
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-700">
            <span className="sr-only">Unread</span>
          </span>
        )}
      </Link>
    </li>
  );
}
