import { Bell } from "lucide-react";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../../application/notification/useNotifications";
import { NotificationItem } from "../components/notification/NotificationItem";

export function NotificationsPage() {
  const list = useNotifications();
  const unread = useUnreadNotificationCount();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-4">
        <div>
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
            Notifications
          </h1>
          <p className="mt-1 text-neutral-500">
            Friend requests, and likes and comments on your memories.
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="h-10 rounded-full border border-neutral-900 px-4 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-60"
          >
            Mark all as read
          </button>
        )}
      </div>

      {list.status === "loading" && (
        <ul className="mt-6 space-y-2" aria-label="Loading notifications">
          {[0, 1, 2].map((key) => (
            <li
              key={key}
              className="flex animate-pulse items-center gap-3 px-3 py-3"
            >
              <span className="h-11 w-11 rounded-full bg-neutral-200" />
              <span className="h-4 flex-1 rounded bg-neutral-200" />
            </li>
          ))}
        </ul>
      )}

      {list.status === "error" && (
        <div className="mt-16 text-center">
          <p className="font-serif text-2xl">
            Couldn't load your notifications
          </p>
          <button
            type="button"
            onClick={list.retry}
            className="mt-6 h-11 rounded-full border border-neutral-900 px-6 text-sm font-medium transition hover:bg-neutral-900 hover:text-white"
          >
            Try again
          </button>
        </div>
      )}

      {list.status === "ready" && list.notifications.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <Bell size={32} strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-3 font-serif text-2xl">Nothing yet</p>
          <p className="mt-1 max-w-sm text-neutral-500">
            When someone sends you a friend request, or likes or comments on
            your memories, it shows up here.
          </p>
        </div>
      )}

      {list.status === "ready" && list.notifications.length > 0 && (
        <>
          <ul className="mt-6 space-y-1">
            {list.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </ul>
          {list.hasMore && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={list.loadMore}
                disabled={list.isLoadingMore}
                className="h-11 rounded-full border border-neutral-900 px-6 text-sm font-medium transition hover:bg-neutral-900 hover:text-white disabled:opacity-60"
              >
                {list.isLoadingMore ? "Loading..." : "Show older"}
              </button>
              {list.loadMoreFailed && (
                <p role="alert" className="text-sm text-red-600">
                  Couldn't load more. Try again.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
