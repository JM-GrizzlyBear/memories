import { MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Memory } from "../../../domain/memory";
import { memoryAgo, memoryDateParts, timeAgo } from "../../format/dates";
import { Avatar } from "../user/Avatar";
import { LikeButton } from "./LikeButton";
import { MemoryActionsMenu } from "./MemoryActionsMenu";
import { PhotoMosaic } from "./PhotoMosaic";
import { VISIBILITY } from "./visibility";

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
  const { label: visibilityLabel, Icon: VisibilityIcon } =
    VISIBILITY[memory.visibility];
  const wasEdited = memory.updatedAt !== memory.createdAt;

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
        <header className="flex items-center gap-3 py-3 pl-4 pr-2 sm:pl-5">
          {author ? (
            <Avatar user={author} />
          ) : (
            <span className="h-9 w-9 shrink-0 rounded-full bg-neutral-300" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {author ? (
                <Link
                  to={`/u/${author.username}`}
                  className="hover:underline hover:underline-offset-4"
                >
                  {authorName}
                </Link>
              ) : (
                authorName
              )}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {memoryAgo(memory.memoryDate)} · kept {timeAgo(memory.createdAt)}
              {wasEdited && " · edited"}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-neutral-600">
            <VisibilityIcon size={13} aria-hidden="true" />
            {visibilityLabel}
          </span>
          {isMine ? (
            <MemoryActionsMenu memory={memory} />
          ) : (
            <span className="w-2" />
          )}
        </header>

        <PhotoMosaic memory={memory} />

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

        <footer className="flex items-center gap-1 border-t border-line px-2 py-1 sm:px-3">
          <LikeButton key={memory.id} memory={memory} />
          <Link
            to={`/memories/${memory.id}#comments`}
            state={{ memory }}
            aria-label={`Comments on "${memory.title}"`}
            className="flex h-11 items-center gap-2 rounded-full px-3 text-sm transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-neutral-900"
          >
            <MessageCircle size={20} aria-hidden="true" />
            <span className="tabular-nums">
              {memory.commentCount}
              <span className="sr-only">
                {memory.commentCount === 1 ? " comment" : " comments"}
              </span>
            </span>
          </Link>
        </footer>
      </div>
    </article>
  );
}
