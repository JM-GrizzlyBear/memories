import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { useMemory } from "../../application/memory/useMemory";
import type { Memory } from "../../domain/memory";
import { VISIBILITY } from "../components/memory/visibility";
import { memoryAgo, memoryDateParts } from "../format/dates";

const SWIPE_DISTANCE = 50; // pixels a finger must move to count as a swipe

export function MemoryViewerPage() {
  const { memoryId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initial =
    (location.state as { memory?: Memory } | null)?.memory ?? null;
  const { memory, status } = useMemory(memoryId, initial);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const swipeStartX = useRef<number | null>(null);

  const photos = memory
    ? [...memory.photos].sort((a, b) => a.position - b.position)
    : [];
  const total = photos.length;
  const requested = Number(searchParams.get("photo")) || 1;
  const index = Math.min(Math.max(requested, 1), Math.max(total, 1)) - 1;

  // Came from inside the app? Go back. Opened from a shared link? Go to the Journal.
  const close = useCallback(() => {
    if (location.key !== "default") navigate(-1);
    else navigate("/");
  }, [location.key, navigate]);

  // replace: flipping photos doesn't add history, so Back closes the viewer in one step
  const goTo = useCallback(
    (next: number) => {
      setSearchParams(
        { photo: String(next + 1) },
        { replace: true, state: location.state },
      );
    },
    [setSearchParams, location.state],
  );

  // Keyboard: arrows flip, Escape closes
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" && index < total - 1) goTo(index + 1);
      else if (event.key === "ArrowLeft" && index > 0) goTo(index - 1);
      else if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [index, total, goTo, close]);

  // Start keyboard users on the close button
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [status]);

  // Download the next and previous photos early, so flipping feels instant
  useEffect(() => {
    for (const neighbor of [photos[index - 1], photos[index + 1]]) {
      if (neighbor) new Image().src = neighbor.url;
    }
  }, [photos, index]);

  if (status !== "ready" || !memory) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center text-ink">
        {status === "loading" && (
          <p className="text-neutral-500">Loading memory...</p>
        )}
        {status === "not-found" && (
          <>
            <p className="font-serif text-3xl">This memory isn't available</p>
            <p className="text-neutral-500">
              It may be private, or it no longer exists.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="font-serif text-3xl">Couldn't open this memory</p>
            <p className="text-neutral-500">
              Check your connection and try again.
            </p>
          </>
        )}
        {status !== "loading" && (
          <Link
            to="/"
            className="mt-2 flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Back to journal
          </Link>
        )}
      </main>
    );
  }

  const photo = photos[index];
  const date = memoryDateParts(memory.memoryDate);
  const { label: visibilityLabel, Icon: VisibilityIcon } =
    VISIBILITY[memory.visibility];
  const authorName = memory.author
    ? `${memory.author.firstName} ${memory.author.lastName}`
    : "Someone";

  return (
    <main className="flex min-h-screen flex-col bg-paper text-ink lg:h-screen lg:flex-row">
      {/* Photos */}
      <section
        aria-label="Photos"
        className="flex min-h-[70vh] flex-1 flex-col lg:min-h-0"
      >
        <div className="flex items-center justify-between gap-4 px-3 py-3">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-neutral-900"
          >
            <X size={22} aria-hidden="true" />
          </button>
          {/* aria-live: screen readers announce "2 of 5" when the photo changes */}
          <p
            aria-live="polite"
            className="text-sm tabular-nums text-neutral-500"
          >
            {index + 1} of {total}
          </p>
          <span className="w-11" aria-hidden="true" />
        </div>

        <div
          className="relative flex flex-1 touch-pan-y select-none items-center justify-center px-4 lg:min-h-0"
          onPointerDown={(event) => {
            swipeStartX.current = event.clientX;
          }}
          onPointerUp={(event) => {
            const start = swipeStartX.current;
            swipeStartX.current = null;
            if (start === null) return;
            const distance = event.clientX - start;
            if (distance < -SWIPE_DISTANCE && index < total - 1)
              goTo(index + 1);
            if (distance > SWIPE_DISTANCE && index > 0) goTo(index - 1);
          }}
        >
          <img
            key={photo.id}
            src={photo.url}
            alt={`${memory.title}, photo ${index + 1} of ${total}`}
            draggable={false}
            className="max-h-[65vh] max-w-full rounded-sm object-contain shadow-lg motion-safe:animate-fade-in lg:max-h-full"
          />

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:border-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900 disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === total - 1}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:border-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900 disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronRight size={24} aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <ol
            aria-label="All photos"
            className="flex justify-center gap-2 overflow-x-auto px-4 py-4"
          >
            {photos.map((thumb, thumbIndex) => (
              <li key={thumb.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => goTo(thumbIndex)}
                  aria-label={`Show photo ${thumbIndex + 1}`}
                  aria-current={thumbIndex === index ? "true" : undefined}
                  className={`block h-14 w-14 overflow-hidden transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                    thumbIndex === index
                      ? "ring-2 ring-neutral-900 ring-offset-2 ring-offset-paper"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={thumb.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* The story */}
      <aside className="border-t border-line bg-paper px-5 py-8 text-ink sm:px-8 lg:w-[420px] lg:overflow-y-auto lg:border-l lg:border-t-0">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-6xl leading-none">{date.day}</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em]">
              {date.month} {date.year}
            </p>
            <p className="text-sm text-neutral-500">
              {memoryAgo(memory.memoryDate)}
            </p>
          </div>
        </div>

        {memory.location && (
          <p className="mt-6 flex items-center gap-1.5 text-sm text-neutral-500">
            <MapPin size={14} aria-hidden="true" />
            {memory.location}
          </p>
        )}
        <h1 className="mt-1.5 font-serif text-3xl leading-tight tracking-tight">
          {memory.title}
        </h1>
        <p className="mt-4 whitespace-pre-line font-serif text-lg leading-relaxed text-neutral-800">
          {memory.story}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
          <span className="text-neutral-600">
            Kept by <span className="font-semibold text-ink">{authorName}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-neutral-600">
            <VisibilityIcon size={13} aria-hidden="true" />
            {visibilityLabel}
          </span>
        </div>
      </aside>
    </main>
  );
}
