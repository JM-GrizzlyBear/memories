import type { MemoryPhoto } from "../../../domain/memory";

interface PhotoMosaicProps {
  photos: MemoryPhoto[];
  title: string;
}

// Arranges photos by count: one big, two side by side, or a cover with two smaller ones
export function PhotoMosaic({ photos, title }: PhotoMosaicProps) {
  const sorted = [...photos].sort((a, b) => a.position - b.position);
  const alt = (index: number) =>
    `${title}, photo ${index + 1} of ${sorted.length}`;

  if (sorted.length === 1) {
    return (
      <img
        src={sorted[0].url}
        alt={alt(0)}
        loading="lazy"
        className="aspect-[4/3] w-full bg-neutral-200 object-cover"
      />
    );
  }

  if (sorted.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {sorted.map((photo, index) => (
          <img
            key={photo.id}
            src={photo.url}
            alt={alt(index)}
            loading="lazy"
            className="aspect-square w-full bg-neutral-200 object-cover"
          />
        ))}
      </div>
    );
  }

  const [cover, second, third] = sorted;
  const remaining = sorted.length - 3;

  return (
    <div className="grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-1">
      <img
        src={cover.url}
        alt={alt(0)}
        loading="lazy"
        className="col-span-2 row-span-2 h-full w-full bg-neutral-200 object-cover"
      />
      <img
        src={second.url}
        alt={alt(1)}
        loading="lazy"
        className="h-full w-full bg-neutral-200 object-cover"
      />
      <div className="relative">
        <img
          src={third.url}
          alt={alt(2)}
          loading="lazy"
          className="h-full w-full bg-neutral-200 object-cover"
        />
        {remaining > 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 font-serif text-3xl text-white">
            +{remaining}
          </span>
        )}
      </div>
    </div>
  );
}
