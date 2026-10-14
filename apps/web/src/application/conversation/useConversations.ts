import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import type { ConversationFolder } from "../../domain/conversation";
import {
  getConversation,
  getMessageCounts,
  listConversations,
  listMessages,
  searchPeopleToMessage,
} from "../../infrastructure/api/conversationApi";
import { ApiError } from "../../infrastructure/api/http";
import { useAuth } from "../auth/useAuth";
import { useDebouncedValue } from "../common/useDebouncedValue";
import { queryKeys } from "../query/queryKeys";

// The chats in one folder (Chats, Requests, Archive), newest first.
// Live events keep them fresh (see useLiveMessages), so no timers.
export function useConversationList(folder: ConversationFolder) {
  return useQuery({
    queryKey: queryKeys.conversationList(folder),
    queryFn: async () => await listConversations(folder),
  });
}

// The numbers on the Messages icon and the Requests tab
export function useMessageCounts() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.messageCounts,
    queryFn: async () => await getMessageCounts(),
    enabled: Boolean(user),
    staleTime: 0, // look again when I come back to the tab
  });
  return query.data ?? { unread: 0, requests: 0 };
}

export function useConversation(id: string) {
  const query = useQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: async () => await getConversation(id),
    staleTime: 0,
    enabled: id !== "",
  });
  const isGone = query.error instanceof ApiError && query.error.status === 404;
  return { ...query, isGone };
}

// Messages, newest page first; "load older" fetches the next page
export function useMessages(id: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(id),
    queryFn: async ({ pageParam }) => await listMessages(id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  });
}

// People I'm allowed to message (friends, and people open to anyone)
export function usePeopleToMessage(text: string) {
  const debounced = useDebouncedValue(text.trim(), 300);
  const query = useQuery({
    queryKey: queryKeys.messagePeople(debounced),
    queryFn: async ({ signal }) =>
      await searchPeopleToMessage(debounced, signal),
    enabled: debounced.length >= 1,
    placeholderData: keepPreviousData,
  });
  return {
    people: debounced ? (query.data ?? []) : [],
    isSearching: query.isFetching,
    hasText: debounced.length >= 1,
  };
}
