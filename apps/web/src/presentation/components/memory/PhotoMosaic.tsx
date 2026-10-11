import { Link } from "react-router";
import type { Memory, MemoryPhoto } from "../../../domain/memory";

interface PhotoMosaicProps {
  memory: Memory;
}

interface PhotoLinkProps {
  memory: Memory;
  photo: MemoryPhoto;
  index: number; // 0-based position in the memory
  total: number;
  className: string;
}

// One photo that opens the viewer at that photo.
// Defined outside PhotoMosaic, so React doesn't rebuild it on every render.
function PhotoLink({ memory, photo, index, total, className }: PhotoLinkProps) {
  return (
    <Link
      to={`/memories/${memory.id}?photo=${index + 1}`}
      state={{ memory }} // the viewer opens instantly, no extra request
      className={`group block overflow-hidden bg-neutral-200 ${className}`}
    >
      <img
        src={photo.url}
        alt={`Open ${memory.title}, photo ${index + 1} of ${total}`}
        loading="lazy"
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />
    </Link>
  );
}

// Arranges photos by count; each one opens the viewer at that photo
export function PhotoMosaic({ memory }: PhotoMosaicProps) {
  const sorted = [...memory.photos].sort((a, b) => a.position - b.position);
  const total = sorted.length;
  const link = (index: number, className: string) => (
    <PhotoLink
      memory={memory}
      photo={sorted[index]}
      index={index}
      total={total}
      className={className}
    />
  );

  if (total === 1) {
    return link(0, "aspect-[4/3]");
  }

  if (total === 2) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {link(0, "aspect-square")}
        {link(1, "aspect-square")}
      </div>
    );
  }

  const remaining = total - 3;

  return (
    <div className="grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-1">
      {link(0, "col-span-2 row-span-2")}
      {link(1, "")}
      <div className="relative">
        {link(2, "h-full")}
        {remaining > 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 font-serif text-3xl text-white"
          >
            +{remaining}
          </span>
        )}
      </div>
    </div>
  );
}
