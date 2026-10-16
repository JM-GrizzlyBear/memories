import { createContext, useContext } from "react";

export interface ChatDock {
  // Larger screens: a chat window at the bottom right. Phones: the chat page.
  open: (conversationId: string) => void;
  close: (conversationId: string) => void;
  // Is this chat open (and not minimized) in a window right now?
  isShowing: (conversationId: string) => boolean;
}

export const ChatDockContext = createContext<ChatDock | null>(null);

export function useChatDock() {
  const dock = useContext(ChatDockContext);
  if (!dock)
    throw new Error("useChatDock must be used inside <ChatDockProvider>");
  return dock;
}
