import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useMemo } from "react";
import type { AppNotification } from "../../domain/notification";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationPage,
} from "../../infrastructure/api/notificationApi";
import { queryKeys } from "../query/queryKeys";

type Status = "loading" | "ready" | "error";
type NotificationData = InfiniteData<NotificationPage, string | null>;

// My notifications, newest first, page by page
export function useNotifications() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.notificationList,
    queryFn: async ({ pageParam }) => await listNotifications(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 0, // look again whenever the page is opened
  });

  const notifications = useMemo(
    () => query.data?.pages.flatMap((page) => page.notifications) ?? [],
    [query.data],
  );

  const status: Status = query.data
    ? "ready"
    : query.isError
      ? "error"
      : "loading";

  return {
    notifications,
    status,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMoreFailed: query.isFetchNextPageError,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}

// The number on the bell
export function useUnreadNotificationCount() {
  const { data } = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: async () => await getUnreadNotificationCount(),
    staleTime: 0, // also checked when I come back to the tab
  });
  return data ?? 0;
}

// Mark some (or all) notifications as read in the cache, so the page and the bell agree
function markReadInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  shouldMark: (notification: AppNotification) => boolean,
) {
  let marked = 0;
  queryClient.setQueryData<NotificationData>(
    queryKeys.notificationList,
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          notifications: page.notifications.map((notification) => {
            if (notification.isRead || !shouldMark(notification)) {
              return notification;
            }
            marked += 1;
            return { ...notification, isRead: true };
          }),
        })),
      },
  );
  return marked;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => await markNotificationRead(id),
    // Instant: the dot disappears and the bell counts down before the server answers
    onMutate: (id) => {
      const marked = markReadInCache(queryClient, (n) => n.id === id);
      queryClient.setQueryData<number>(queryKeys.unreadNotifications, (count) =>
        Math.max(0, (count ?? 0) - marked),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.unreadNotifications,
      }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => await markAllNotificationsRead(),
    onMutate: () => {
      markReadInCache(queryClient, () => true);
      queryClient.setQueryData(queryKeys.unreadNotifications, 0);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
