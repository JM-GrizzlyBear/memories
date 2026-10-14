import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Conversation, Message } from "../../domain/conversation";
import type { MessagePage } from "../../infrastructure/api/conversationApi";
import { queryKeys } from "../query/queryKeys";

// A chat's messages as TanStack Query keeps them: pages of 30, newest page first
export type MessagesData = InfiniteData<MessagePage, string | null>;

// A new message goes on top of the newest page (once, even if the live event
// and the send answer both bring it)
export function addMessageToCache(queryClient: QueryClient, message: Message) {
  queryClient.setQueryData<MessagesData>(
    queryKeys.messages(message.conversationId),
    (data) => {
      if (!data || data.pages.length === 0) return data;
      const already = data.pages.some((page) =>
        page.messages.some((existing) => existing.id === message.id),
      );
      if (already) return replaceIn(data, message);
      const [newest, ...older] = data.pages;
      return {
        ...data,
        pages: [
          { ...newest, messages: [message, ...newest.messages] },
          ...older,
        ],
      };
    },
  );
}

// An edited or unsent message changes in place
export function replaceMessageInCache(
  queryClient: QueryClient,
  message: Message,
) {
  queryClient.setQueryData<MessagesData>(
    queryKeys.messages(message.conversationId),
    (data) => (data ? replaceIn(data, message) : data),
  );
}

function replaceIn(data: MessagesData, message: Message): MessagesData {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((existing) =>
        existing.id === message.id ? message : existing,
      ),
    })),
  };
}

// Someone saw the chat up to `lastReadAt`: move their "Seen"
export function setReadInCache(
  queryClient: QueryClient,
  conversationId: string,
  userId: string,
  lastReadAt: string,
) {
  queryClient.setQueryData<Conversation>(
    queryKeys.conversation(conversationId),
    (conversation) =>
      conversation
        ? {
            ...conversation,
            members: conversation.members.map((member) =>
              member.id === userId ? { ...member, lastReadAt } : member,
            ),
          }
        : conversation,
  );
}

// The lists and the header badge load again (they're small)
export function refreshChatLists(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.conversationLists });
  void queryClient.invalidateQueries({ queryKey: queryKeys.messageCounts });
}
