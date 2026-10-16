import type { GroupRole } from "@memories/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Conversation } from "../../domain/conversation";
import {
  acceptConversation,
  addGroupMembers,
  createGroup,
  declineConversation,
  editMessage,
  markConversationRead,
  removeGroupMember,
  renameGroup,
  sendMessage,
  setArchived,
  setGroupPhoto,
  setMemberRole,
  startDirectChat,
  unsendMessage,
} from "../../infrastructure/api/conversationApi";
import { queryKeys } from "../query/queryKeys";
import {
  addMessageToCache,
  refreshChatLists,
  replaceMessageInCache,
  setReadInCache,
} from "./messageCache";

// Open (or start) the chat with one person
export function useStartDirectChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => await startDirectChat(userId),
    onSuccess: (conversation) => {
      queryClient.setQueryData(
        queryKeys.conversation(conversation.id),
        conversation,
      );
      refreshChatLists(queryClient);
    },
    meta: { errorMessage: "Couldn't open the chat. Try again." },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      memberIds,
    }: {
      name: string;
      memberIds: string[];
    }) => await createGroup(name, memberIds),
    onSuccess: (conversation) => {
      queryClient.setQueryData(
        queryKeys.conversation(conversation.id),
        conversation,
      );
      refreshChatLists(queryClient);
    },
    meta: { errorToast: false }, // shown inside the New message dialog
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, photos }: { body: string; photos: File[] }) =>
      await sendMessage(conversationId, body, photos),
    onSuccess: (message) => {
      addMessageToCache(queryClient, message);
      refreshChatLists(queryClient);
    },
    meta: { errorMessage: "Couldn't send your message. Try again." },
  });
}

export function useEditMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      body,
    }: {
      messageId: string;
      body: string;
    }) => await editMessage(conversationId, messageId, body),
    onSuccess: (message) => {
      replaceMessageInCache(queryClient, message);
      refreshChatLists(queryClient);
    },
    meta: { errorMessage: "Couldn't edit your message." },
  });
}

export function useUnsendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) =>
      await unsendMessage(conversationId, messageId),
    onSuccess: (message) => {
      replaceMessageInCache(queryClient, message);
      refreshChatLists(queryClient);
    },
    meta: { errorMessage: "Couldn't unsend your message. Try again." },
  });
}

// Everything in the open chat is seen (silently: nothing to tell if it fails)
export function useMarkConversationRead(conversationId: string, myId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => await markConversationRead(conversationId),
    onSuccess: (lastReadAt) => {
      if (!lastReadAt) return;
      setReadInCache(queryClient, conversationId, myId, lastReadAt);
      queryClient.setQueryData<Conversation>(
        queryKeys.conversation(conversationId),
        (conversation) =>
          conversation
            ? {
                ...conversation,
                unread: false,
                me: { ...conversation.me, lastReadAt },
              }
            : conversation,
      );
      refreshChatLists(queryClient);
    },
    meta: { errorToast: false },
  });
}

// Accept, decline, archive and every group change: the chat and the lists load again
function useChatAction<TInput>(
  conversationId: string,
  action: (input: TInput) => Promise<void>,
  errorMessage: string,
  errorToast = true,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: async () => {
      refreshChatLists(queryClient);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(conversationId),
        exact: true,
      });
    },
    meta: errorToast ? { errorMessage } : { errorToast: false },
  });
}

export function useAcceptConversation(id: string) {
  return useChatAction(
    id,
    async () => await acceptConversation(id),
    "Couldn't accept the chat. Try again.",
  );
}

export function useDeclineConversation(id: string) {
  return useChatAction(
    id,
    async () => await declineConversation(id),
    "Couldn't decline the chat. Try again.",
  );
}

export function useArchiveConversation(id: string) {
  return useChatAction(
    id,
    async (archived: boolean) => await setArchived(id, archived),
    "Couldn't move the chat. Try again.",
  );
}

// Group settings live in a dialog, so their errors show inside it (not as toasts)
export function useAddGroupMembers(id: string) {
  return useChatAction(
    id,
    async (memberIds: string[]) => await addGroupMembers(id, memberIds),
    "",
    false,
  );
}

export function useRemoveGroupMember(id: string) {
  return useChatAction(
    id,
    async (userId: string) => await removeGroupMember(id, userId),
    "",
    false,
  );
}

export function useSetMemberRole(id: string) {
  return useChatAction(
    id,
    async ({ userId, role }: { userId: string; role: GroupRole }) =>
      await setMemberRole(id, userId, role),
    "",
    false,
  );
}

export function useRenameGroup(id: string) {
  return useChatAction(
    id,
    async (name: string) => await renameGroup(id, name),
    "",
    false,
  );
}

export function useSetGroupPhoto(id: string) {
  return useChatAction(
    id,
    async (photo: File | null) => await setGroupPhoto(id, photo),
    "",
    false,
  );
}
