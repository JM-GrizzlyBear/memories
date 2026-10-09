import { Link } from "react-router";
import type { Memory } from "../../../domain/memory";

interface PhotoMosaicProps {
  memory: Memory;
}

// Arranges photos by count; each one opens the viewer at that photo
export function PhotoMosaic({ memory }: PhotoMosaicProps) {
  const sorted = [...memory.photos].sort((a, b) => a.position - b.position);
  const total = sorted.length;

  function PhotoLink({
    index,
    className,
  }: {
    index: number;
    className: string;
  }) {
    const photo = sorted[index];
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

  if (total === 1) {
    return <PhotoLink index={0} className="aspect-[4/3]" />;
  }

  if (total === 2) {
    return (
      <div className="grid grid-cols-2 gap-1">
        <PhotoLink index={0} className="aspect-square" />
        <PhotoLink index={1} className="aspect-square" />
      </div>
    );
  }

  const remaining = total - 3;

  return (
    <div className="grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-1">
      <PhotoLink index={0} className="col-span-2 row-span-2" />
      <PhotoLink index={1} className="" />
      <div className="relative">
        <PhotoLink index={2} className="h-full" />
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
