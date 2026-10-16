import { MESSAGE_LIMITS } from "@memories/shared";
import type { ConversationMember, Message } from "../../../domain/conversation";
import { fullName, unsentText } from "../../format/chatText";
import { thumbnailUrl } from "../../format/photoUrl";
import { Avatar } from "../user/Avatar";
import { MessageOptions } from "./MessageOptions";

export interface BubblePlace {
  isMine: boolean;
  firstInRun: boolean; // show the name (groups) and more space above
  lastInRun: boolean; // show the avatar (others)
  showName: boolean;
}

interface MessageBubbleProps {
  message: Message;
  place: BubblePlace;
  seenBy: ConversationMember[]; // groups: whose "seen" stops here
  status: "Seen" | "Sent" | null; // direct chats: under my latest message
  onEdit: (message: Message) => void;
  onUnsend: (message: Message) => void;
  myId: string;
}

function canStillEdit(message: Message) {
  const ageMs = Date.now() - Date.parse(message.createdAt);
  return Boolean(message.body) && ageMs <= MESSAGE_LIMITS.editMinutes * 60_000;
}

function Photos({ message, isMine }: { message: Message; isMine: boolean }) {
  const count = message.photos.length;
  const columns =
    count === 1
      ? "grid-cols-1"
      : count === 2 || count === 4
        ? "grid-cols-2"
        : "grid-cols-3";
  return (
    <div
      className={`grid ${columns} w-64 max-w-full gap-1 sm:w-72 ${isMine ? "ml-auto" : ""}`}
    >
      {message.photos.map((photo, index) => (
        <a
          key={photo.id}
          href={photo.url}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-xl bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <img
            src={thumbnailUrl(
              photo.url,
              count === 1 ? 640 : 320,
              count === 1 ? 480 : 320,
            )}
            alt={`Photo ${index + 1} of ${count}`}
            loading="lazy"
            className={`w-full object-cover ${count === 1 ? "max-h-80" : "aspect-square"}`}
          />
        </a>
      ))}
    </div>
  );
}

// One message: your own on the right (dark), others on the left (white)
export function MessageBubble({
  message,
  place,
  seenBy,
  status,
  onEdit,
  onUnsend,
  myId,
}: MessageBubbleProps) {
  const { isMine } = place;
  const isUnsent = Boolean(message.unsentAt);
  const canAct = isMine && !isUnsent;

  return (
    <li className={`${place.firstInRun ? "mt-3" : "mt-0.5"}`}>
      {place.showName && message.sender && (
        <p className="mb-1 ml-11 text-xs text-neutral-500">
          {message.sender.firstName}
        </p>
      )}

      <div
        className={`group flex items-end gap-2 ${isMine ? "justify-end" : ""}`}
      >
        {!isMine && (
          <span className="w-9 shrink-0">
            {place.lastInRun && message.sender && (
              <Avatar user={message.sender} size="sm" />
            )}
          </span>
        )}

        {canAct && (
          <div className="self-center">
            <MessageOptions
              canEdit={() => canStillEdit(message)}
              onEdit={() => onEdit(message)}
              onUnsend={() => onUnsend(message)}
            />
          </div>
        )}

        <div
          className={`flex max-w-[78%] flex-col gap-1 sm:max-w-[65%] ${isMine ? "items-end" : "items-start"}`}
        >
          {isUnsent ? (
            <p className="rounded-2xl border border-line px-4 py-2 text-sm italic text-neutral-500">
              {unsentText(message, myId)}
            </p>
          ) : (
            <>
              {message.photos.length > 0 && (
                <Photos message={message} isMine={isMine} />
              )}
              {message.body && (
                <p
                  className={`rounded-2xl px-4 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words ${
                    isMine
                      ? "bg-ink text-paper"
                      : "border border-line bg-white text-ink"
                  }`}
                >
                  {message.body}
                </p>
              )}
            </>
          )}
          {message.editedAt && !isUnsent && (
            <span className="px-1 text-xs text-neutral-500">Edited</span>
          )}
        </div>
      </div>

      {status && (
        <p
          className="mt-1 text-right text-xs text-neutral-500"
          aria-live="polite"
        >
          {status}
        </p>
      )}
      {seenBy.length > 0 && (
        <div
          className="mt-1 flex justify-end gap-0.5"
          title={`Seen by ${seenBy.map(fullName).join(", ")}`}
        >
          <span className="sr-only">
            Seen by {seenBy.map((member) => member.firstName).join(", ")}
          </span>
          {seenBy.slice(0, 8).map((member) => (
            <Avatar key={member.id} user={member} size="xs" />
          ))}
          {seenBy.length > 8 && (
            <span aria-hidden="true" className="text-xs text-neutral-500">
              +{seenBy.length - 8}
            </span>
          )}
        </div>
      )}
    </li>
  );
}
