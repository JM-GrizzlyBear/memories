import { Archive, Inbox, MailQuestion, SquarePen } from "lucide-react";
import { Link, NavLink } from "react-router";
import {
  useConversationList,
  useMessageCounts,
} from "../../../application/conversation/useConversations";
import type { ConversationFolder } from "../../../domain/conversation";
import {
  conversationTitle,
  previewText,
  shortTime,
} from "../../format/chatText";
import { ChatAvatar } from "./ChatAvatar";

const FOLDERS: {
  folder: ConversationFolder;
  label: string;
  to: string;
  icon: typeof Inbox;
}[] = [
  { folder: "inbox", label: "Chats", to: "/messages", icon: Inbox },
  {
    folder: "requests",
    label: "Requests",
    to: "/messages/requests",
    icon: MailQuestion,
  },
  {
    folder: "archive",
    label: "Archive",
    to: "/messages/archive",
    icon: Archive,
  },
];

const EMPTY: Record<ConversationFolder, string> = {
  inbox: "No chats yet. Start one with a friend.",
  requests:
    "No message requests. People who aren't your friends show up here first.",
  archive: "Nothing archived. Chats you archive or decline end up here.",
};

interface ConversationListProps {
  folder: ConversationFolder;
  openId: string | null;
  myId: string;
  onNewMessage: () => void;
}

// The left side of Messages: folders, then the chats in the chosen one
export function ConversationList({
  folder,
  openId,
  myId,
  onNewMessage,
}: ConversationListProps) {
  const list = useConversationList(folder);
  const counts = useMessageCounts();
  const conversations = list.data ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3 sm:px-5">
        <h1 className="font-serif text-3xl tracking-tight">Messages</h1>
        <button
          type="button"
          onClick={onNewMessage}
          aria-haspopup="dialog"
          className="flex h-10 items-center gap-2 rounded-full border border-ink px-4 text-sm font-medium transition hover:bg-neutral-100"
        >
          <SquarePen size={16} aria-hidden="true" />
          New
          <span className="sr-only"> message</span>
        </button>
      </div>

      <nav
        aria-label="Message folders"
        className="flex gap-1 border-b border-line px-3 sm:px-4"
      >
        {FOLDERS.map(({ folder: id, label, to, icon: Icon }) => (
          <NavLink
            key={id}
            to={to}
            end
            className={() =>
              `flex h-11 items-center gap-1.5 border-b-2 px-2 text-sm font-medium transition ${
                folder === id
                  ? "border-ink text-ink"
                  : "border-transparent text-neutral-500 hover:text-ink"
              }`
            }
            aria-current={folder === id ? "page" : undefined}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
            {id === "requests" && counts.requests > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1.5 text-xs font-semibold tabular-nums text-white">
                {counts.requests}
                <span className="sr-only"> waiting</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.isPending ? (
          <ul aria-label="Loading chats" className="animate-pulse">
            {[0, 1, 2, 3].map((index) => (
              <li
                key={index}
                className="flex items-center gap-3 px-4 py-3 sm:px-5"
              >
                <span className="h-12 w-12 rounded-full bg-neutral-200" />
                <span className="flex-1 space-y-2">
                  <span className="block h-4 w-32 rounded bg-neutral-200" />
                  <span className="block h-3 w-48 rounded bg-neutral-200" />
                </span>
              </li>
            ))}
          </ul>
        ) : list.isError ? (
          <div className="px-5 py-10 text-center">
            <p className="text-neutral-500">Couldn't load your chats.</p>
            <button
              type="button"
              onClick={() => void list.refetch()}
              className="mt-3 h-10 rounded-full border border-ink px-5 text-sm font-medium transition hover:bg-neutral-100"
            >
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-neutral-500">
            {EMPTY[folder]}
          </p>
        ) : (
          <ul>
            {conversations.map((conversation) => {
              const isOpen = conversation.id === openId;
              const title = conversationTitle(conversation, myId);
              return (
                <li key={conversation.id}>
                  <Link
                    to={`/messages/c/${conversation.id}`}
                    aria-current={isOpen ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 transition sm:px-5 ${
                      isOpen ? "bg-neutral-200/70" : "hover:bg-neutral-100"
                    }`}
                  >
                    <ChatAvatar conversation={conversation} myId={myId} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={`truncate ${conversation.unread ? "font-semibold" : "font-medium"}`}
                        >
                          {title}
                        </span>
                        {conversation.lastMessageAt && (
                          <span className="shrink-0 text-xs text-neutral-500">
                            {shortTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span
                          className={`truncate text-sm ${
                            conversation.unread
                              ? "font-medium text-ink"
                              : "text-neutral-500"
                          }`}
                        >
                          {previewText(conversation, myId)}
                        </span>
                        {conversation.unread && (
                          <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-red-700">
                            <span className="sr-only">New messages</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
