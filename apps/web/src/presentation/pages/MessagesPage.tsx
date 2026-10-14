import { MessagesSquare } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "react-router";
import { useAuth } from "../../application/auth/useAuth";
import { useConversation } from "../../application/conversation/useConversations";
import type { ConversationFolder } from "../../domain/conversation";
import { ChatView } from "../components/messages/ChatView";
import { ConversationList } from "../components/messages/ConversationList";
import { NewChatDialog } from "../components/messages/NewChatDialog";

function folderFromPath(pathname: string): ConversationFolder | null {
  if (pathname.startsWith("/messages/requests")) return "requests";
  if (pathname.startsWith("/messages/archive")) return "archive";
  if (pathname === "/messages" || pathname === "/messages/") return "inbox";
  return null; // a chat is open: its own folder decides
}

// (69px = the header above)
// Messages: the list on the left and the open chat on the right.
// Phones show one at a time: the list, or the chat with a back button.
export function MessagesPage() {
  const { user } = useAuth();
  const { conversationId = null } = useParams();
  const { pathname } = useLocation();
  const [isNewOpen, setIsNewOpen] = useState(false);
  const open = useConversation(conversationId ?? "");

  if (!user) return null;

  // With a chat open, the list shows the folder that chat is in
  const me = conversationId ? open.data?.me : null;
  const folder: ConversationFolder =
    folderFromPath(pathname) ??
    (me?.status === "request"
      ? "requests"
      : me?.status === "declined" || me?.archived
        ? "archive"
        : "inbox");

  return (
    <main className="mx-auto flex h-[calc(100dvh-69px)] max-w-6xl overflow-hidden border-line lg:border-x">
      <div
        className={`min-h-0 w-full flex-col border-line lg:flex lg:w-96 lg:shrink-0 lg:border-r ${
          conversationId ? "hidden" : "flex"
        }`}
      >
        <ConversationList
          folder={folder}
          openId={conversationId}
          myId={user.id}
          onNewMessage={() => setIsNewOpen(true)}
        />
      </div>

      <div
        className={`min-h-0 flex-1 flex-col bg-paper ${conversationId ? "flex" : "hidden lg:flex"}`}
      >
        {conversationId ? (
          <ChatView conversationId={conversationId} myId={user.id} />
        ) : (
          <div className="m-auto flex flex-col items-center px-6 text-center">
            <MessagesSquare
              size={40}
              aria-hidden="true"
              className="text-neutral-400"
            />
            <p className="mt-3 font-serif text-2xl">Your messages</p>
            <p className="mt-1 text-sm text-neutral-500">
              Pick a chat, or start a new one.
            </p>
            <button
              type="button"
              onClick={() => setIsNewOpen(true)}
              className="mt-5 h-11 rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-neutral-800"
            >
              New message
            </button>
          </div>
        )}
      </div>

      <NewChatDialog open={isNewOpen} onClose={() => setIsNewOpen(false)} />
    </main>
  );
}
