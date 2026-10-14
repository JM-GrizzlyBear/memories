import { Link } from "react-router";
import type { AlbumYear } from "../../../domain/album";
import { monthDay } from "../../format/dates";
import { AlbumNote } from "./AlbumNote";

interface AlbumWordsProps {
  page: AlbumYear;
  username: string;
  canEdit: boolean;
}

// The words side of a year: the owner's line about it and every memory, by title
export function AlbumWords({ page, username, canEdit }: AlbumWordsProps) {
  return (
    <>
      <h2 className="text-xs font-semibold tracking-[0.2em] uppercase">
        {page.year}, in words
      </h2>
      <AlbumNote
        // A fresh editor for every year
        key={page.year}
        page={page}
        username={username}
        canEdit={canEdit}
      />
      <ul className="mt-6 min-h-0 flex-1 overflow-y-auto border-t border-neutral-300">
        {page.memories.map((memory) => (
          <li key={memory.id} className="border-b border-line">
            <Link
              to={`/memories/${memory.id}`}
              className="flex min-h-11 items-center justify-between gap-4 py-2 text-sm transition hover:text-neutral-600"
            >
              <span className="min-w-0 truncate">{memory.title}</span>
              <span className="shrink-0 text-neutral-500">
                {monthDay(memory.memoryDate)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
