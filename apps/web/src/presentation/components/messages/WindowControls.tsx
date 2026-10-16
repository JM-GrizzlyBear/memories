import { Maximize2, Minus, X } from "lucide-react";
import { Link } from "react-router";

// The buttons in a chat window's title bar
export function WindowControls({
  conversationId,
  onMinimize,
  onClose,
}: {
  conversationId: string;
  onMinimize?: () => void;
  onClose?: () => void;
}) {
  const control =
    "flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-ink";
  return (
    <div className="flex shrink-0 items-center">
      <Link
        to={`/messages/c/${conversationId}`}
        onClick={onClose}
        aria-label="Open in Messages"
        title="Open in Messages"
        className={control}
      >
        <Maximize2 size={16} aria-hidden="true" />
      </Link>
      {onMinimize && (
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize chat"
          title="Minimize"
          className={control}
        >
          <Minus size={18} aria-hidden="true" />
        </button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          title="Close"
          className={control}
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
