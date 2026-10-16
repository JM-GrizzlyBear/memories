import { toast } from "sonner";
import {
  useAcceptConversation,
  useDeclineConversation,
} from "../../../application/conversation/useMessageMutations";
import type { Conversation } from "../../../domain/conversation";
import { conversationTitle, otherMember } from "../../format/chatText";

interface RequestBarProps {
  conversation: Conversation;
  myId: string;
}

// In place of the message box until you accept: you can read, but not reply
export function RequestBar({ conversation, myId }: RequestBarProps) {
  const accept = useAcceptConversation(conversation.id);
  const decline = useDeclineConversation(conversation.id);
  const isWorking = accept.isPending || decline.isPending;
  const isGroup = conversation.kind === "group";
  const isDeclined = conversation.me.status === "declined";

  const other = otherMember(conversation, myId);
  const adder = conversation.me.addedBy;

  const heading = isDeclined
    ? "You declined this chat"
    : isGroup
      ? `${adder?.firstName ?? "Someone"} added you to ${conversationTitle(conversation, myId)}`
      : `${other?.firstName ?? "Someone"} wants to message you`;
  const detail = isDeclined
    ? "Accept it to reply. They were never told you declined."
    : isGroup
      ? "Join to start chatting, or decline to move it to your archive."
      : "They won't know you've seen this until you accept.";

  async function onAccept() {
    try {
      await accept.mutateAsync();
      toast.success(isGroup ? "You joined the group" : "Chat accepted");
    } catch {
      // The error toast says what went wrong
    }
  }

  async function onDecline() {
    try {
      await decline.mutateAsync();
      toast.success("Moved to your archive", {
        description: "You can still accept it from there.",
      });
    } catch {
      // The error toast says what went wrong
    }
  }

  return (
    <div className="border-t border-line bg-white px-4 py-4 text-center sm:px-6">
      <p className="font-medium">{heading}</p>
      <p className="mt-0.5 text-sm text-neutral-500">{detail}</p>
      <div className="mt-3 flex justify-center gap-2">
        {!isDeclined && (
          <button
            type="button"
            onClick={onDecline}
            disabled={isWorking}
            className="h-11 rounded-full border border-ink px-6 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-60"
          >
            {decline.isPending ? "Declining…" : "Decline"}
          </button>
        )}
        <button
          type="button"
          onClick={onAccept}
          disabled={isWorking}
          className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {accept.isPending ? "Accepting…" : isGroup ? "Join" : "Accept"}
        </button>
      </div>
    </div>
  );
}
