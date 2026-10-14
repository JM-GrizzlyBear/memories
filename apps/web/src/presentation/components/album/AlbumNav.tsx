import { ChevronLeft, ChevronRight } from "lucide-react";

interface AlbumNavProps {
  label: string;
  canGoBack: boolean;
  canGoOn: boolean;
  onBack: () => void;
  onOn: () => void;
}

// Previous / next year, with where you are in between (read out when it changes)
export function AlbumNav({
  label,
  canGoBack,
  canGoOn,
  onBack,
  onOn,
}: AlbumNavProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Previous page"
        className="flex h-13 w-13 items-center justify-center rounded-full border border-ink transition hover:bg-neutral-100 disabled:border-line disabled:text-neutral-300 disabled:hover:bg-transparent"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <p
        aria-live="polite"
        className="min-w-44 text-center text-sm text-neutral-600"
      >
        {label}
      </p>
      <button
        type="button"
        onClick={onOn}
        disabled={!canGoOn}
        aria-label="Next page"
        className="flex h-13 w-13 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
