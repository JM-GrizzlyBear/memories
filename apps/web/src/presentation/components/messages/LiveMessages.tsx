import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../../application/auth/useAuth";
import { useLiveMessages } from "../../../application/conversation/useLiveMessages";
import type { Conversation, Message } from "../../../domain/conversation";
import { conversationTitle } from "../../format/chatText";
import { useChatDock } from "./ChatDockContext";

function preview(message: Message) {
  if (message.body) return message.body;
  return message.photos.length === 1
    ? "Sent a photo"
    : `Sent ${message.photos.length} photos`;
}

// A toast for each new message, unless you're already looking at that chat
export function LiveMessages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const myId = user?.id ?? "";
  const dock = useChatDock();

  const showToast = useCallback(
    (message: Message, conversation: Conversation | null) => {
      if (
        message.kind !== "text" ||
        message.sender?.id === myId ||
        !message.sender
      )
        return;
      // Already looking at it (on the Messages page, or in a chat window)
      if (pathname === `/messages/c/${message.conversationId}`) return;
      if (dock.isShowing(message.conversationId)) return;
      // Declined chats stay quiet
      if (!conversation || conversation.me.status === "declined") return;

      const name = `${message.sender.firstName} ${message.sender.lastName}`;
      const isRequest = conversation.me.status === "request";
      const where =
        conversation.kind === "group"
          ? ` in ${conversationTitle(conversation, myId)}`
          : "";
      toast(isRequest ? `Message request from ${name}` : `${name}${where}`, {
        id: `chat-${message.conversationId}`, // one toast per chat, the latest message
        description: preview(message).slice(0, 120),
        action: {
          label: "Open",
          onClick: () =>
            pathname.startsWith("/messages")
              ? navigate(`/messages/c/${message.conversationId}`)
              : dock.open(message.conversationId),
        },
      });
    },
    [myId, navigate, pathname, dock],
  );

  useLiveMessages(showToast);
  return null;
}
