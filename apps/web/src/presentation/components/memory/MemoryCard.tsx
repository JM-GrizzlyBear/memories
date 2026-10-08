import { Globe, Lock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import type { Memory, Visibility } from "../../../domain/memory";
import { memoryAgo, memoryDateParts, timeAgo } from "../../format/dates";
import { PhotoMosaic } from "./PhotoMosaic";

const VISIBILITY = {
  public: { label: "Everyone", Icon: Globe },
  friends: { label: "Friends", Icon: Users },
  private: { label: "Only me", Icon: Lock },
} satisfies Record<Visibility, { label: string; Icon: typeof Globe }>;

const STORY_PREVIEW_LENGTH = 280;

interface MemoryCardProps {
  memory: Memory;
  currentUserId: string;
}

export function MemoryCard({ memory, currentUserId }: MemoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const date = memoryDateParts(memory.memoryDate);
  const author = memory.author;
  const isMine = memory.userId === currentUserId;
  const authorName = isMine
    ? "You"
    : author
      ? `${author.firstName} ${author.lastName}`
      : "Someone";
  const initials = author
    ? `${author.firstName[0] ?? ""}${author.lastName[0] ?? ""}`.toUpperCase()
    : "?";
  const { label: visibilityLabel, Icon: VisibilityIcon } =
    VISIBILITY[memory.visibility];

  const isLong = memory.story.length > STORY_PREVIEW_LENGTH;
  const story =
    isLong && !isExpanded
      ? `${memory.story.slice(0, STORY_PREVIEW_LENGTH).trimEnd()}…`
      : memory.story;

  return (
    <article className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-6">
      {/* Timeline: the day it happened */}
      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.15em]">
          {date.month}
        </span>
        <span className="font-serif text-4xl leading-none sm:text-6xl">
          {date.day}
        </span>
        <span className="mt-1 text-sm text-neutral-500">{date.year}</span>
        <span aria-hidden="true" className="mt-3 w-px flex-1 bg-neutral-300" />
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-white">
        <header className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-300 text-xs font-semibold"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{authorName}</p>
            <p className="truncate text-xs text-neutral-500">
              {memoryAgo(memory.memoryDate)} · kept {timeAgo(memory.createdAt)}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-neutral-600">
            <VisibilityIcon size={13} aria-hidden="true" />
            {visibilityLabel}
          </span>
        </header>

        <PhotoMosaic photos={memory.photos} title={memory.title} />

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {memory.location && (
            <p className="flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin size={14} aria-hidden="true" />
              {memory.location}
            </p>
          )}
          <h2 className="mt-1.5 font-serif text-2xl leading-tight tracking-tight sm:text-3xl">
            {memory.title}
          </h2>
          <p className="mt-3 whitespace-pre-line font-serif text-lg leading-relaxed text-neutral-800">
            {story}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              aria-expanded={isExpanded}
              className="mt-2 min-h-11 text-sm font-semibold underline underline-offset-4"
            >
              {isExpanded ? "Close the story" : "Read the story"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
