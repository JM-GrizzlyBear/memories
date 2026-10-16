import { RotateCcw } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import type { Album } from "../../../domain/album";
import { AlbumPrints } from "./AlbumPrints";
import { AlbumWords } from "./AlbumWords";

interface AlbumCardsProps {
  album: Album;
  current: number;
  direction: "on" | "back"; // which way the last move went, for the slide
  canEdit: boolean;
  onBack: () => void;
  onOn: () => void;
}

const SWIPE_PX = 50;

// Phones and small screens: one year at a time, as a card. Swipe (or use the
// buttons) to change years; flip the card over to read the year in words.
export function AlbumCards({
  album,
  current,
  direction,
  canEdit,
  onBack,
  onOn,
}: AlbumCardsProps) {
  const page = album.years[current];
  return (
    <YearCard
      // A new card (unflipped, sliding in) for every year
      key={page.year}
      album={album}
      current={current}
      direction={direction}
      canEdit={canEdit}
      onBack={onBack}
      onOn={onOn}
    />
  );
}

function YearCard({
  album,
  current,
  direction,
  canEdit,
  onBack,
  onOn,
}: AlbumCardsProps) {
  const page = album.years[current];
  const [isFlipped, setIsFlipped] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const onPointerDown = (event: PointerEvent) => {
    start.current = { x: event.clientX, y: event.clientY };
    swiped.current = false;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    swiped.current = true; // don't also open the photo the finger was on
    if (dx < 0) onOn();
    else onBack();
  };

  const flipButton =
    "flex h-11 items-center gap-2 self-start rounded-full border border-ink px-4 text-sm font-medium transition hover:bg-neutral-100";

  return (
    <div
      className={`mx-auto w-full max-w-lg touch-pan-y perspective-[2000px] ${
        direction === "on" ? "album-from-right" : "album-from-left"
      }`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (start.current = null)}
      onClickCapture={(event) => {
        if (swiped.current) {
          event.preventDefault();
          event.stopPropagation();
          swiped.current = false;
        }
      }}
    >
      <div
        className="album-card grid"
        style={{ transform: `rotateY(${isFlipped ? 180 : 0}deg)` }}
      >
        <section
          aria-label={`${page.year}, photos`}
          inert={isFlipped}
          className="album-face col-start-1 row-start-1 flex flex-col rounded-xl border border-line bg-white p-5 shadow-sm"
        >
          <AlbumPrints page={page} />
          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className={`${flipButton} mt-6`}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Read {page.year} in words
          </button>
        </section>

        <section
          aria-label={`${page.year}, in words`}
          inert={!isFlipped}
          className="album-face col-start-1 row-start-1 flex max-h-[80vh] flex-col rounded-xl border border-line bg-[#f2f1ec] p-6 [transform:rotateY(180deg)]"
        >
          <AlbumWords
            page={page}
            username={album.owner.username}
            canEdit={canEdit}
          />
          <button
            type="button"
            onClick={() => setIsFlipped(false)}
            className={`${flipButton} mt-5 shrink-0`}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Back to the photos
          </button>
        </section>
      </div>
    </div>
  );
}
