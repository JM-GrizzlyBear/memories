import { Fragment, useEffect, useRef } from "react";
import type {
  Conversation,
  ConversationMember,
  Message,
} from "../../../domain/conversation";
import { separatorTime, systemText } from "../../format/chatText";
import { MessageBubble, type BubblePlace } from "./MessageBubble";

const RUN_GAP_MS = 5 * 60_000; // messages closer than this sit together
const TIME_GAP_MS = 30 * 60_000; // a time line after a pause this long

interface MessageListProps {
  conversation: Conversation;
  myId: string;
  messages: Message[]; // oldest first
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  typingNames: string[];
  onEdit: (message: Message) => void;
  onUnsend: (message: Message) => void;
}

function sameRun(a: Message | undefined, b: Message | undefined) {
  return (
    a !== undefined &&
    b !== undefined &&
    a.kind === "text" &&
    b.kind === "text" &&
    a.sender?.id === b.sender?.id &&
    Math.abs(Date.parse(b.createdAt) - Date.parse(a.createdAt)) < RUN_GAP_MS
  );
}

// Where each person's "seen" stops: the newest message from before they last looked
function seenMarkers(
  conversation: Conversation,
  messages: Message[],
  myId: string,
) {
  const markers = new Map<string, ConversationMember[]>();
  for (const member of conversation.members) {
    if (
      member.id === myId ||
      member.status !== "accepted" ||
      !member.lastReadAt
    )
      continue;
    const readAt = Date.parse(member.lastReadAt);
    // (Only text messages show it; system lines have no bubble)
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index];
      if (message.kind !== "text") continue;
      if (Date.parse(message.createdAt) <= readAt) {
        // Nobody needs to see that you've seen your own message
        if (message.sender?.id !== member.id) {
          markers.set(message.id, [...(markers.get(message.id) ?? []), member]);
        }
        break;
      }
    }
  }
  return markers;
}

// The conversation itself. The list is upside down (newest at the bottom, where it
// starts scrolled to), so older pages load in at the top without jumping.
export function MessageList({
  conversation,
  myId,
  messages,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  typingNames,
  onEdit,
  onUnsend,
}: MessageListProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const isGroup = conversation.kind === "group";

  // Scrolling to the top loads older messages
  useEffect(() => {
    const top = topRef.current;
    if (!top || !hasOlder) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadOlder();
    });
    observer.observe(top);
    return () => observer.disconnect();
  }, [hasOlder, onLoadOlder]);

  const markers = isGroup
    ? seenMarkers(conversation, messages, myId)
    : new Map<string, ConversationMember[]>();

  // Direct chats: "Seen" or "Sent" under my newest message
  let myLatestId: string | null = null;
  let myLatestStatus: "Seen" | "Sent" | null = null;
  if (!isGroup) {
    const mine = [...messages]
      .reverse()
      .find(
        (message) => message.sender?.id === myId && message.kind === "text",
      );
    const other = conversation.members.find((member) => member.id !== myId);
    if (mine) {
      myLatestId = mine.id;
      const seen =
        other?.status === "accepted" &&
        other.lastReadAt !== null &&
        Date.parse(other.lastReadAt) >= Date.parse(mine.createdAt);
      myLatestStatus = seen ? "Seen" : "Sent";
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-3 py-4 sm:px-6">
      <div>
        <div ref={topRef} aria-hidden="true" className="h-px" />
        {hasOlder && (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={isLoadingOlder}
              className="h-9 rounded-full border border-line bg-white px-4 text-sm text-neutral-600 transition hover:border-neutral-400 disabled:opacity-60"
            >
              {isLoadingOlder ? "Loading…" : "Load earlier messages"}
            </button>
          </div>
        )}
        {!hasOlder && messages.length > 0 && (
          <p className="mb-4 text-center text-xs text-neutral-400">
            This is the beginning of the chat
          </p>
        )}

        <ol aria-label="Messages">
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const showTime =
              !previous ||
              Date.parse(message.createdAt) - Date.parse(previous.createdAt) >
                TIME_GAP_MS;
            const separator = showTime ? (
              <li className="my-4 text-center text-xs font-medium text-neutral-500">
                <time dateTime={message.createdAt}>
                  {separatorTime(message.createdAt)}
                </time>
              </li>
            ) : null;

            if (message.kind === "system") {
              return (
                <Fragment key={message.id}>
                  {separator}
                  <li className="my-3 px-6 text-center text-xs text-neutral-500">
                    {systemText(message, myId)}
                  </li>
                </Fragment>
              );
            }

            const isMine = message.sender?.id === myId;
            // (A pause long enough for a time line always starts a new run)
            const firstInRun = !sameRun(previous, message);
            const place: BubblePlace = {
              isMine,
              firstInRun,
              lastInRun: !sameRun(message, next),
              showName: isGroup && !isMine && firstInRun,
            };
            return (
              <Fragment key={message.id}>
                {separator}
                <MessageBubble
                  message={message}
                  place={place}
                  seenBy={markers.get(message.id) ?? []}
                  status={message.id === myLatestId ? myLatestStatus : null}
                  onEdit={onEdit}
                  onUnsend={onUnsend}
                  myId={myId}
                />
              </Fragment>
            );
          })}
        </ol>

        {typingNames.length > 0 && (
          <div
            className="mt-3 flex items-center gap-2 pl-11"
            aria-live="polite"
          >
            <span
              className="flex h-8 items-center gap-1 rounded-2xl border border-line bg-white px-3"
              aria-hidden="true"
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 motion-reduce:animate-none"
                  style={{ animationDelay: `${dot * 150}ms` }}
                />
              ))}
            </span>
            <span className="text-xs text-neutral-500">
              {typingNames.length === 1
                ? `${typingNames[0]} is typing…`
                : `${typingNames.slice(0, 2).join(" and ")} are typing…`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
