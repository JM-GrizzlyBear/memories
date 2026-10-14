import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useStartDirectChat } from "../../../application/conversation/useMessageMutations";

// On a profile: opens your chat with them (or a new one)
export function MessageButton({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const start = useStartDirectChat();

  async function open() {
    try {
      const conversation = await start.mutateAsync(userId);
      navigate(`/messages/c/${conversation.id}`);
    } catch {
      // The error toast says what went wrong
    }
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={start.isPending}
      className="flex h-10 items-center gap-2 rounded-full border border-neutral-900 px-4 text-sm font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <MessageCircle size={16} aria-hidden="true" />
      {start.isPending ? "Opening…" : "Message"}
    </button>
  );
}
