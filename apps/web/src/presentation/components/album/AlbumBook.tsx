import type { Album } from "../../../domain/album";
import { memoryCountText } from "../../format/albumText";
import { monthDay } from "../../format/dates";
import { AlbumPrints } from "./AlbumPrints";
import { AlbumWords } from "./AlbumWords";

interface AlbumBookProps {
  album: Album;
  turned: number; // how many pages are turned: 0 = the newest year, years.length = the end
  canEdit: boolean;
  onRestart: () => void;
}

// Larger screens: an open book. The cover is on the left, and each year is a page
// that turns from right to left: photos on the front, the year in words on the back.
export function AlbumBook({
  album,
  turned,
  canEdit,
  onRestart,
}: AlbumBookProps) {
  const { owner, years } = album;
  const total = years.reduce((sum, page) => sum + page.memoryCount, 0);
  const newest = years[0];
  const oldest = years[years.length - 1];
  const first = oldest.memories[oldest.memories.length - 1];

  return (
    <div className="relative mx-auto h-150 w-260 perspective-[2600px]">
      {/* The cover, always on the left (pages turned onto it cover it) */}
      <div className="absolute inset-y-0 left-0 flex w-130 flex-col justify-between rounded-l-xl bg-ink px-12 py-14 text-paper">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-neutral-400 uppercase">
            An album by {owner.firstName} {owner.lastName}
          </p>
          <p className="mt-6 font-serif text-6xl leading-none tracking-tight">
            Little things worth keeping
          </p>
        </div>
        <div className="text-sm text-neutral-400">
          <p>
            {oldest.year === newest.year
              ? newest.year
              : `${oldest.year} – ${newest.year}`}{" "}
            · {memoryCountText(total)}
          </p>
          <p className="mt-1">Turn the page to travel back in time.</p>
        </div>
      </div>

      {/* Under every page on the right: the end of the album */}
      <div
        inert={turned < years.length}
        className="absolute inset-y-0 left-130 flex w-130 flex-col items-center justify-center rounded-r-xl border border-line bg-white px-14 text-center"
      >
        <p className="text-xs font-semibold tracking-[0.2em] uppercase">
          Where it all began
        </p>
        {first && (
          <p className="mt-5 font-serif text-3xl leading-snug tracking-tight">
            {first.title}
            <span className="mt-2 block text-base text-neutral-500">
              {monthDay(first.memoryDate)}, {oldest.year}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="mt-8 h-11 rounded-full border border-ink px-5 text-sm font-medium transition hover:bg-neutral-100"
        >
          Back to {newest.year}
        </button>
      </div>

      {years.map((page, index) => {
        const isTurned = index < turned;
        // You see the front of the page on the right, and the back of the last turned one on the left
        const frontVisible = index === turned;
        const backVisible = index === turned - 1;
        return (
          <div
            key={page.year}
            className="album-leaf absolute inset-y-0 left-130 w-130"
            style={{
              transform: `rotateY(${isTurned ? -180 : 0}deg)`,
              // Turned pages pile up on the left (the latest on top); the rest wait on the right in order
              zIndex: isTurned ? index + 1 : years.length - index + 10,
            }}
          >
            <section
              aria-label={`${page.year}, photos`}
              inert={!frontVisible}
              className="album-face absolute inset-0 flex flex-col rounded-r-xl border border-line bg-white px-11 py-10"
            >
              <AlbumPrints page={page} />
            </section>
            <section
              aria-label={`${page.year}, in words`}
              inert={!backVisible}
              className="album-face absolute inset-0 flex flex-col rounded-l-xl border border-line bg-[#f2f1ec] p-12 [transform:rotateY(180deg)]"
            >
              <AlbumWords
                page={page}
                username={owner.username}
                canEdit={canEdit}
              />
            </section>
          </div>
        );
      })}

      {/* The spine */}
      <div className="absolute inset-y-0 left-[518px] z-50 w-1 bg-neutral-600" />
    </div>
  );
}
