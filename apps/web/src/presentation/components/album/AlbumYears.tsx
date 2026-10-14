import type { AlbumYear } from "../../../domain/album";

interface AlbumYearsProps {
  years: AlbumYear[];
  current: number; // index of the year on screen
  onPick: (index: number) => void;
}

// "Jump to" any year of the album
export function AlbumYears({ years, current, onPick }: AlbumYearsProps) {
  return (
    <nav aria-label="Years" className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-xs font-semibold tracking-[0.15em] uppercase">
        Jump to
      </span>
      {years.map((page, index) => {
        const isCurrent = index === current;
        return (
          <button
            key={page.year}
            type="button"
            aria-pressed={isCurrent}
            onClick={() => onPick(index)}
            className={`h-11 min-w-18 rounded-full border px-4 font-serif text-xl transition-colors ${
              isCurrent
                ? "border-ink bg-ink text-paper"
                : "border-line bg-white hover:border-neutral-400"
            }`}
          >
            {page.year}
          </button>
        );
      })}
    </nav>
  );
}
