import {
  ChevronDown,
  Info,
  Maximize2,
  MessagesSquare,
  UserRound,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { Link } from "react-router";
import type { Conversation } from "../../../domain/conversation";
import { otherMember } from "../../format/chatText";
import { ChatAvatar } from "./ChatAvatar";

interface WindowTitleMenuProps {
  conversation: Conversation;
  myId: string;
  title: string;
  subtitle: string;
  onDetails: () => void; // group details
  onClose?: () => void; // the window closes when the chat opens in Messages
}

const item =
  "flex min-h-11 w-full items-center gap-2.5 rounded px-3 text-left text-sm text-ink transition hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none";

// A chat window's name: click it for a small menu, like Messenger on Facebook
// (all chats, this chat in Messages, their profile or the group's details)
export function WindowTitleMenu({
  conversation,
  myId,
  title,
  subtitle,
  onDetails,
  onClose,
}: WindowTitleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firstRef = useRef<HTMLAnchorElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const other =
    conversation.kind === "direct" ? otherMember(conversation, myId) : null;

  useEffect(() => {
    if (isOpen) firstRef.current?.focus();
  }, [isOpen]);

  // Clicking or tabbing anywhere outside closes it
  const closeOnBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
  };

  return (
    <div
      className="relative min-w-0 flex-1"
      onBlur={closeOnBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.stopPropagation();
          setIsOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`${title}, chat options`}
        className="flex w-full min-w-0 items-center gap-2 rounded-lg py-1 pr-1 text-left transition hover:bg-neutral-100 aria-expanded:bg-neutral-100"
      >
        <ChatAvatar conversation={conversation} myId={myId} size="sm" />
        <span className="min-w-0">
          <span className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold">{title}</span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
          <span className="block truncate text-xs text-neutral-500">
            {subtitle}
          </span>
        </span>
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-10 mt-1 w-60 rounded-md border border-line bg-white p-1.5 shadow-lg"
        >
          <Link ref={firstRef} to="/messages" role="menuitem" className={item}>
            <MessagesSquare size={16} aria-hidden="true" />
            See all chats
          </Link>
          <Link
            to={`/messages/c/${conversation.id}`}
            role="menuitem"
            onClick={onClose}
            className={item}
          >
            <Maximize2 size={16} aria-hidden="true" />
            Open in Messages
          </Link>
          <div className="my-1 border-t border-line" />
          {other ? (
            <Link
              to={`/u/${other.username}`}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className={item}
            >
              <UserRound size={16} aria-hidden="true" />
              View profile
            </Link>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onDetails();
              }}
              className={item}
            >
              <Info size={16} aria-hidden="true" />
              Group details
            </button>
          )}
        </div>
      )}
    </div>
  );
}
