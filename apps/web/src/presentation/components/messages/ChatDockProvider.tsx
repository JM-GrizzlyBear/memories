import { X } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../application/auth/useAuth";
import { useMediaQuery } from "../../../application/common/useMediaQuery";
import { useConversation } from "../../../application/conversation/useConversations";
import { conversationTitle } from "../../format/chatText";
import { ChatAvatar } from "./ChatAvatar";
import { ChatDockContext, type ChatDock } from "./ChatDockContext";
import { ChatView } from "./ChatView";

interface DockedChat {
  id: string;
  minimized: boolean;
}

const WIDE = "(min-width: 1024px)"; // room for chat windows
const EXTRA_WIDE = "(min-width: 1280px)"; // room for three

// Chat windows at the bottom right, like Messenger on Facebook. They stay open
// while you move around the app. Phones open the chat page instead.
export function ChatDockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isWide = useMediaQuery(WIDE);
  const isExtraWide = useMediaQuery(EXTRA_WIDE);
  const [chats, setChats] = useState<DockedChat[]>([]);
  const maxWindows = isExtraWide ? 3 : 2;

  // The Messages page and the full-screen memory viewer have no windows on top
  const isHidden =
    !user ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/memories/");

  const open = useCallback(
    (id: string) => {
      if (!isWide) {
        navigate(`/messages/c/${id}`);
        return;
      }
      setChats((current) => {
        // Newest on the right; the oldest window closes when there's no room
        const rest = current.filter((chat) => chat.id !== id);
        return [...rest, { id, minimized: false }].slice(-3);
      });
      if (pathname.startsWith("/messages")) navigate(`/messages/c/${id}`);
    },
    [isWide, navigate, pathname],
  );

  const close = useCallback((id: string) => {
    setChats((current) => current.filter((chat) => chat.id !== id));
  }, []);

  const setMinimized = useCallback((id: string, minimized: boolean) => {
    setChats((current) =>
      current.map((chat) => (chat.id === id ? { ...chat, minimized } : chat)),
    );
  }, []);

  const visible = useMemo(
    () => (isHidden || !isWide ? [] : chats.slice(-maxWindows)),
    [isHidden, isWide, chats, maxWindows],
  );

  const dock: ChatDock = useMemo(
    () => ({
      open,
      close,
      isShowing: (id) =>
        visible.some((chat) => chat.id === id && !chat.minimized),
    }),
    [open, close, visible],
  );

  return (
    <ChatDockContext.Provider value={dock}>
      {children}
      {user && visible.length > 0 && (
        <div
          aria-label="Chat windows"
          className="pointer-events-none fixed bottom-0 right-4 z-30 flex items-end gap-3"
        >
          {visible.map((chat) => (
            <DockWindow
              key={chat.id}
              chat={chat}
              myId={user.id}
              onClose={() => close(chat.id)}
              onMinimize={(minimized) => setMinimized(chat.id, minimized)}
            />
          ))}
        </div>
      )}
    </ChatDockContext.Provider>
  );
}

interface DockWindowProps {
  chat: DockedChat;
  myId: string;
  onClose: () => void;
  onMinimize: (minimized: boolean) => void;
}

function DockWindow({ chat, myId, onClose, onMinimize }: DockWindowProps) {
  if (chat.minimized) {
    return (
      <MinimizedTab
        id={chat.id}
        myId={myId}
        onClose={onClose}
        onOpen={() => onMinimize(false)}
      />
    );
  }
  return (
    <div className="pointer-events-auto relative flex h-[min(480px,calc(100dvh-90px))] w-84 flex-col overflow-hidden rounded-t-xl border border-b-0 border-line bg-paper shadow-2xl">
      <ChatView
        conversationId={chat.id}
        myId={myId}
        variant="window"
        onClose={onClose}
        onMinimize={() => onMinimize(true)}
      />
    </div>
  );
}

// A minimized chat: just its name bar; click to open it again
function MinimizedTab({
  id,
  myId,
  onOpen,
  onClose,
}: {
  id: string;
  myId: string;
  onOpen: () => void;
  onClose: () => void;
}) {
  const chat = useConversation(id);
  const title = chat.data ? conversationTitle(chat.data, myId) : "Chat";
  const unread = chat.data?.unread ?? false;

  return (
    <div className="pointer-events-auto flex h-12 w-60 items-center gap-1 rounded-t-xl border border-b-0 border-line bg-paper pl-2 pr-1 shadow-lg">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open chat with ${title}`}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left"
      >
        {chat.data && (
          <ChatAvatar conversation={chat.data} myId={myId} size="sm" />
        )}
        <span
          className={`truncate text-sm ${unread ? "font-semibold" : "font-medium"}`}
        >
          {title}
        </span>
        {unread && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-700"
            aria-label="New messages"
          />
        )}
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close chat with ${title}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
