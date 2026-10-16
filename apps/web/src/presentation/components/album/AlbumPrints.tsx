import { ImageOff } from "lucide-react";
import { Link } from "react-router";
import type { AlbumYear } from "../../../domain/album";
import { memoryCountText } from "../../format/albumText";
import { monthDay } from "../../format/dates";
import { thumbnailUrl } from "../../format/photoUrl";

// Each print sits a little crooked, like photos pressed into a real album
const TILTS = ["-1deg", "1deg", "0.5deg", "-0.5deg"];
const PRINTS_PER_PAGE = 4;

// The photo side of a year: the year, how many memories, and up to four prints
export function AlbumPrints({ page }: { page: AlbumYear }) {
  const prints = page.memories.slice(0, PRINTS_PER_PAGE);
  const more = page.memoryCount - prints.length;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-6xl leading-none tracking-tighter lg:text-7xl">
          {page.year}
        </h2>
        <p className="text-sm text-neutral-500">
          {memoryCountText(page.memoryCount)}
        </p>
      </div>

      <ul className="mt-7 grid grid-cols-2 gap-4 lg:gap-5">
        {prints.map((memory, index) => (
          <li key={memory.id}>
            <Link
              to={`/memories/${memory.id}`}
              style={{ rotate: TILTS[index % TILTS.length] }}
              className="block border border-line bg-white px-2 pt-2 pb-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
            >
              {memory.coverUrl ? (
                <img
                  src={thumbnailUrl(memory.coverUrl)}
                  alt=""
                  className="aspect-4/3 w-full bg-neutral-200 object-cover lg:aspect-auto lg:h-30"
                />
              ) : (
                <span className="flex aspect-4/3 w-full items-center justify-center bg-neutral-200 text-neutral-400 lg:aspect-auto lg:h-30">
                  <ImageOff size={20} aria-hidden="true" />
                </span>
              )}
              <span className="mt-2 line-clamp-2 block font-serif text-[15px] leading-tight lg:line-clamp-1">
                {memory.title}
              </span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                {monthDay(memory.memoryDate)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {more > 0 && (
        <p className="mt-5 text-sm text-neutral-500">
          And {memoryCountText(more)} more, listed on the next page.
        </p>
      )}
    </>
  );
}
