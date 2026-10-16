import { useQueryClient } from "@tanstack/react-query";
import type { Conversation, Message } from "../../domain/conversation";
import { getConversation } from "../../infrastructure/api/conversationApi";
import { queryKeys } from "../query/queryKeys";
import { useRealtimeEvent } from "../realtime/useRealtime";
import {
  addMessageToCache,
  refreshChatLists,
  replaceMessageInCache,
  setReadInCache,
} from "./messageCache";

interface MessageEventPayload {
  conversationId: string;
  message: Message;
}

// Keeps every chat on screen up to date as things happen, and hands each new
// message (with its chat) to `onNew`, for the toast
export function useLiveMessages(
  onNew: (message: Message, conversation: Conversation | null) => void,
) {
  const queryClient = useQueryClient();

  useRealtimeEvent<MessageEventPayload>("message:new", async ({ message }) => {
    addMessageToCache(queryClient, message);
    refreshChatLists(queryClient);
    // Lines like "Ana added Ben" change the people in the chat
    if (message.kind === "system") {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(message.conversationId),
        exact: true,
      });
    }

    // The chat it belongs to (from memory, or asked for once) decides the toast
    let conversation: Conversation | null;
    try {
      conversation = await queryClient.fetchQuery({
        queryKey: queryKeys.conversation(message.conversationId),
        queryFn: async () => await getConversation(message.conversationId),
        staleTime: 10_000,
      });
    } catch {
      conversation = null;
    }
    onNew(message, conversation);
  });

  useRealtimeEvent<MessageEventPayload>("message:changed", ({ message }) => {
    replaceMessageInCache(queryClient, message);
    refreshChatLists(queryClient);
  });

  useRealtimeEvent<{ conversationId: string }>(
    "conversation:changed",
    ({ conversationId }) => {
      refreshChatLists(queryClient);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(conversationId),
      });
    },
  );

  useRealtimeEvent<{
    conversationId: string;
    userId: string;
    lastReadAt: string;
  }>("conversation:read", ({ conversationId, userId, lastReadAt }) => {
    setReadInCache(queryClient, conversationId, userId, lastReadAt);
    refreshChatLists(queryClient);
  });

  // Back online after a drop: catch up on anything missed meanwhile
  useRealtimeEvent<void>("connect", () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  });
}
