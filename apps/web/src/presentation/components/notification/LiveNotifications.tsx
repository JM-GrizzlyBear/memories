import { useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useLiveNotifications } from "../../../application/notification/useLiveNotifications";
import { useMarkNotificationRead } from "../../../application/notification/useNotifications";
import type { AppNotification } from "../../../domain/notification";
import { describeNotification } from "../../format/notificationText";

// Shows a toast for every new notification while you're logged in (on any page)
export function LiveNotifications() {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();

  const showToast = useCallback(
    (notification: AppNotification) => {
      const { name, action, href } = describeNotification(notification);
      toast(`${name} ${action}`, {
        id: notification.id, // the same notification again replaces its toast
        action: {
          label: "View",
          onClick: () => {
            markRead.mutate(notification.id);
            navigate(href);
          },
        },
      });
    },
    [markRead, navigate],
  );

  useLiveNotifications(showToast);
  return null;
}
