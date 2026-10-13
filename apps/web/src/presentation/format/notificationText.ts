import type { AppNotification } from "../../domain/notification";

export interface NotificationText {
  name: string; // who did it (shown in bold)
  action: string; // what they did
  href: string; // where opening it goes
}

// "Ana Cruz" + "liked your memory “Lola's garden”." and where it leads
export function describeNotification(
  notification: AppNotification,
): NotificationText {
  const { actor, memory } = notification;
  const name = `${actor.firstName} ${actor.lastName}`;
  const title = memory ? `“${memory.title}”` : null;

  let action: string;
  let target: string;
  switch (notification.type) {
    case "friend_request":
      action = "sent you a friend request.";
      target = `/u/${actor.username}`;
      break;
    case "friend_accepted":
      action = "accepted your friend request.";
      target = `/u/${actor.username}`;
      break;
    case "memory_liked":
      action = title
        ? `liked your memory ${title}.`
        : "liked a memory that's no longer here.";
      target = memory ? `/memories/${memory.id}` : "";
      break;
    case "memory_commented": {
      const preview = notification.commentPreview
        ? `: “${notification.commentPreview}”`
        : ".";
      action = title
        ? `commented on ${title}${preview}`
        : "commented on a memory that's no longer here.";
      target = memory ? `/memories/${memory.id}#comments` : "";
      break;
    }
  }

  return {
    name,
    action,
    // What it points to is gone: show a page that says so (like Facebook)
    href:
      notification.isAvailable && target
        ? target
        : "/notifications/unavailable",
  };
}
