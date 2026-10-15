import { Archive, ArchiveRestore, ChevronLeft, Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  useConversation,
  useMessages,
} from "../../../application/conversation/useConversations";
import {
  useArchiveConversation,
  useEditMessage,
  useMarkConversationRead,
  useSendMessage,
  useUnsendMessage,
} from "../../../application/conversation/useMessageMutations";
import {
  useRealtimeEvent,
  useRealtimeSocket,
} from "../../../application/realtime/useRealtime";
import {
  hasLeft,
  type Conversation,
  type Message,
} from "../../../domain/conversation";
import {
  conversationTitle,
  groupSizeText,
  otherMember,
} from "../../format/chatText";
import { ChatAvatar } from "./ChatAvatar";
import { ChatDetailsDialog } from "./ChatDetailsDialog";
import { Composer } from "./Composer";
import { ConfirmDialog } from "./ConfirmDialog";
import { MessageList } from "./MessageList";
import { RequestBar } from "./RequestBar";

const TYPING_SHOWS_MS = 4000;
const TYPING_SENDS_EVERY_MS = 2500;

function withoutKey(record: Record<string, number>, key: string) {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

interface ChatViewProps {
  conversationId: string;
  myId: string;
}

// The right side of Messages (or the whole screen on phones): one open chat
export function ChatView({ conversationId, myId }: ChatViewProps) {
  const chat = useConversation(conversationId);

  if (chat.isGone) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-2xl">This chat isn't available</p>
        <p className="mt-1 text-sm text-neutral-500">
          You may have left it, or been removed from it.
        </p>
        <Link
          to="/messages"
          className="mt-5 flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper"
        >
          Back to your chats
        </Link>
      </div>
    );
  }

  if (!chat.data) {
    return (
      <div className="flex flex-1 flex-col" aria-label="Loading the chat">
        <div className="flex h-16 animate-pulse items-center gap-3 border-b border-line px-4">
          <span className="h-10 w-10 rounded-full bg-neutral-200" />
          <span className="h-4 w-40 rounded bg-neutral-200" />
        </div>
        {chat.isError && (
          <div className="m-auto text-center">
            <p className="text-neutral-500">Couldn't load this chat.</p>
            <button
              type="button"
              onClick={() => void chat.refetch()}
              className="mt-3 h-10 rounded-full border border-ink px-5 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  return <OpenChat key={conversationId} conversation={chat.data} myId={myId} />;
}

function OpenChat({
  conversation,
  myId,
}: {
  conversation: Conversation;
  myId: string;
}) {
  const id = conversation.id;
  const messagesQuery = useMessages(id);
  const send = useSendMessage(id);
  const edit = useEditMessage(id);
  const unsend = useUnsendMessage(id);
  const archive = useArchiveConversation(id);
  const { mutate: markRead } = useMarkConversationRead(id, myId);
  const socket = useRealtimeSocket();

  const [editing, setEditing] = useState<Message | null>(null);
  const [unsending, setUnsending] = useState<Message | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [typing, setTyping] = useState<Record<string, number>>({});
  const [lastTypingSent, setLastTypingSent] = useState(0);

  const isAccepted = conversation.me.status === "accepted";
  const isOut = hasLeft(conversation.me.status); // left the group, or removed
  const title = conversationTitle(conversation, myId);
  const other =
    conversation.kind === "direct" ? otherMember(conversation, myId) : null;

  // Pages come newest first; the list wants oldest first
  const messages = (messagesQuery.data?.pages ?? [])
    .flatMap((page) => page.messages)
    .slice()
    .reverse();
  const newest = messages[messages.length - 1];

  // Seen: whenever something new from someone else shows up while I'm here
  useEffect(() => {
    if (!isAccepted || !newest) return;
    if (newest.sender?.id === myId && !conversation.unread) return;
    if (document.visibilityState !== "visible") return;
    markRead();
  }, [isAccepted, newest, myId, conversation.unread, markRead]);

  // ...and when I come back to the tab
  useEffect(() => {
    if (!isAccepted) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") markRead();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isAccepted, markRead]);

  // "Ana is typing…": shown for a few seconds after each signal
  useRealtimeEvent<{ conversationId: string; userId: string }>(
    "typing",
    (event) => {
      if (event.conversationId !== id) return;
      const until = Date.now() + TYPING_SHOWS_MS;
      setTyping((current) => ({ ...current, [event.userId]: until }));
      setTimeout(() => {
        setTyping((current) => {
          if ((current[event.userId] ?? 0) > Date.now()) return current;
          return withoutKey(current, event.userId);
        });
      }, TYPING_SHOWS_MS + 50);
    },
  );

  // Their message arrived: they're done typing
  useRealtimeEvent<{ conversationId: string; message: Message }>(
    "message:new",
    (event) => {
      const senderId = event.message.sender?.id;
      if (event.conversationId !== id || !senderId) return;
      setTyping((current) =>
        senderId in current ? withoutKey(current, senderId) : current,
      );
    },
  );

  const typingNames = Object.keys(typing)
    .map(
      (userId) =>
        conversation.members.find((member) => member.id === userId)?.firstName,
    )
    .filter((name): name is string => Boolean(name));

  function onTyping() {
    const now = Date.now();
    if (now - lastTypingSent < TYPING_SENDS_EVERY_MS) return;
    setLastTypingSent(now);
    socket?.emit("typing", { conversationId: id });
  }

  async function onSend(body: string, photos: File[]) {
    try {
      await send.mutateAsync({ body, photos });
      return true;
    } catch {
      return false; // the error toast explains; the text comes back
    }
  }

  async function onSaveEdit(message: Message, body: string) {
    if (body === message.body) return true;
    try {
      await edit.mutateAsync({ messageId: message.id, body });
      return true;
    } catch {
      return false;
    }
  }

  async function confirmUnsend() {
    if (!unsending) return;
    try {
      await unsend.mutateAsync(unsending.id);
      if (editing?.id === unsending.id) setEditing(null);
    } finally {
      setUnsending(null);
    }
  }

  async function toggleArchive() {
    const archived = !conversation.me.archived;
    try {
      await archive.mutateAsync(archived);
      toast.success(archived ? "Chat archived" : "Moved back to your chats", {
        description: archived ? "A new message brings it back." : undefined,
      });
    } catch {
      // The error toast says what went wrong
    }
  }

  const loadOlder = useCallback(() => {
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      void messagesQuery.fetchNextPage();
    }
  }, [messagesQuery]);

  const subtitle =
    conversation.kind === "group"
      ? groupSizeText(conversation)
      : other
        ? `@${other.username}`
        : "";

  return (
    <section
      aria-label={`Chat with ${title}`}
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-2 sm:px-4">
        <Link
          to={
            conversation.me.status === "request"
              ? "/messages/requests"
              : "/messages"
          }
          aria-label="Back to chats"
          className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-neutral-100 lg:hidden"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          aria-haspopup="dialog"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 pr-2 text-left transition hover:bg-neutral-100 sm:pl-1"
        >
          <ChatAvatar conversation={conversation} myId={myId} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{title}</span>
            <span className="block truncate text-xs text-neutral-500">
              {subtitle}
            </span>
          </span>
        </button>
        {(isAccepted || isOut) && (
          <button
            type="button"
            onClick={toggleArchive}
            disabled={archive.isPending}
            aria-label={
              conversation.me.archived ? "Move back to chats" : "Archive chat"
            }
            title={
              conversation.me.archived ? "Move back to chats" : "Archive chat"
            }
            className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-ink"
          >
            {conversation.me.archived ? (
              <ArchiveRestore size={20} aria-hidden="true" />
            ) : (
              <Archive size={20} aria-hidden="true" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          aria-label="Chat details"
          aria-haspopup="dialog"
          className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-ink"
        >
          <Info size={20} aria-hidden="true" />
        </button>
      </header>

      {messagesQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading messages…
        </div>
      ) : messagesQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center text-sm text-neutral-500">
          Couldn't load the messages.
          <button
            type="button"
            onClick={() => void messagesQuery.refetch()}
            className="mt-3 h-10 rounded-full border border-ink px-5 font-medium text-ink"
          >
            Try again
          </button>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <ChatAvatar conversation={conversation} myId={myId} size="lg" />
          <p className="mt-4 font-serif text-2xl">{title}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {other && other.status !== "accepted"
              ? `${other.firstName} isn't your friend yet, so your first message arrives as a request.`
              : "Say hi. Your messages show up here."}
          </p>
        </div>
      ) : (
        <MessageList
          conversation={conversation}
          myId={myId}
          messages={messages}
          hasOlder={Boolean(messagesQuery.hasNextPage)}
          isLoadingOlder={messagesQuery.isFetchingNextPage}
          onLoadOlder={loadOlder}
          typingNames={typingNames}
          onEdit={setEditing}
          onUnsend={setUnsending}
        />
      )}

      {isAccepted ? (
        <Composer
          key={editing?.id ?? "new"}
          editing={editing}
          onSend={onSend}
          onSaveEdit={onSaveEdit}
          onCancelEdit={() => setEditing(null)}
          onTyping={onTyping}
        />
      ) : isOut ? (
        // Like Messenger: you keep the chat up to when you left, but can't write in it
        <p
          role="status"
          className="border-t border-line bg-white px-4 py-5 text-center text-sm text-neutral-600"
        >
          {conversation.me.status === "removed"
            ? "You were removed from the group. You can't send messages here anymore."
            : "You left the group. You can't send messages here anymore."}
        </p>
      ) : (
        <RequestBar conversation={conversation} myId={myId} />
      )}

      <ConfirmDialog
        open={Boolean(unsending)}
        title="Unsend this message?"
        description="It disappears for everyone in the chat. They'll see that you unsent a message."
        confirmLabel="Unsend"
        workingLabel="Unsending…"
        isWorking={unsend.isPending}
        onConfirm={() => void confirmUnsend()}
        onClose={() => setUnsending(null)}
      />

      <ChatDetailsDialog
        open={detailsOpen}
        conversation={conversation}
        myId={myId}
        onClose={() => setDetailsOpen(false)}
      />
    </section>
  );
}
