import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useMediaQuery } from "../../../application/common/useMediaQuery";
import type { Album } from "../../../domain/album";
import { AlbumBook } from "./AlbumBook";
import { AlbumCards } from "./AlbumCards";
import { AlbumNav } from "./AlbumNav";
import { AlbumYears } from "./AlbumYears";

const END = "end";

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

interface AlbumViewProps {
  album: Album;
  canEdit: boolean;
}

// Someone's memories as a book, one page per year (newest first).
// The page you're on is in the address (?year=2024), so opening a photo and
// coming back returns you to the same page.
export function AlbumView({ album, canEdit }: AlbumViewProps) {
  const { years } = album;
  const isBook = useMediaQuery("(min-width: 1100px)");
  const [params, setParams] = useSearchParams();
  const [direction, setDirection] = useState<"on" | "back">("on");

  // How many pages are turned: 0 = the newest year, years.length = past the last one
  const asked = params.get("year");
  const found = years.findIndex((page) => String(page.year) === asked);
  const turned = asked === END ? years.length : Math.max(found, 0);
  // Cards have no "end": the oldest year is the last card
  const lastPage = isBook ? years.length : years.length - 1;
  const current = Math.min(turned, lastPage);
  const yearIndex = Math.min(current, years.length - 1);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(next, lastPage));
    if (clamped === current) return;
    setDirection(clamped > current ? "on" : "back");
    setParams(
      (previous) => {
        const updated = new URLSearchParams(previous);
        if (clamped === 0) updated.delete("year");
        else
          updated.set(
            "year",
            clamped >= years.length ? END : String(years[clamped].year),
          );
        return updated;
      },
      { replace: true },
    );
  };

  // ← and → turn the pages (unless you're typing or a dialog is open)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
      if (isTyping(event.target) || document.querySelector("dialog[open]"))
        return;
      if (event.key === "ArrowRight") goTo(current + 1);
      if (event.key === "ArrowLeft") goTo(current - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const label =
    current >= years.length
      ? "The beginning of the album"
      : `Now reading ${years[current].year}`;

  return (
    <div className="mt-8">
      <AlbumYears years={years} current={yearIndex} onPick={goTo} />

      <div className="mt-8 overflow-x-clip py-2">
        {isBook ? (
          <AlbumBook
            album={album}
            turned={current}
            canEdit={canEdit}
            onRestart={() => goTo(0)}
          />
        ) : (
          <AlbumCards
            album={album}
            current={current}
            direction={direction}
            canEdit={canEdit}
            onBack={() => goTo(current - 1)}
            onOn={() => goTo(current + 1)}
          />
        )}
      </div>

      <div className="mt-6">
        <AlbumNav
          label={label}
          canGoBack={current > 0}
          canGoOn={current < lastPage}
          onBack={() => goTo(current - 1)}
          onOn={() => goTo(current + 1)}
        />
      </div>
    </div>
  );
}
