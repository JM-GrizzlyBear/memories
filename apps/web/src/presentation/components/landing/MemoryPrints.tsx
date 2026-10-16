// Two tilted photo prints and a memory card: a picture of what Memories is.
// Decorative only (screen readers skip it); the text around it says the same.
export function MemoryPrints({ dark = false }: { dark?: boolean }) {
  const shadow = dark
    ? "shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
    : "shadow-[0_18px_40px_rgba(20,20,20,0.10)]";

  return (
    <div
      aria-hidden="true"
      className="relative h-100 w-full max-w-[480px] sm:h-[520px]"
    >
      <figure
        className={`absolute left-0 top-6 m-0 w-[62%] -rotate-4 border border-line bg-white p-2.5 pb-4 sm:top-10 sm:p-3 sm:pb-[18px] ${shadow}`}
      >
        <div className="h-40 bg-[#cbc8c1] sm:h-55" />
        <figcaption className="mt-2.5 font-serif text-[17px] text-ink sm:mt-3 sm:text-xl">
          Road trip to La Union
        </figcaption>
        <p className="mt-0.5 text-xs text-neutral-500 sm:mt-1 sm:text-[13px]">
          Mar 15, 2025
        </p>
      </figure>

      <figure
        className={`absolute right-0 top-0 m-0 w-[56%] rotate-3 border border-line bg-white p-2.5 pb-4 sm:p-3 sm:pb-[18px] ${shadow}`}
      >
        <div className="h-35 bg-[#d9d7d1] sm:h-47" />
        <figcaption className="mt-2.5 font-serif text-[17px] text-ink sm:mt-3 sm:text-xl">
          Lola's garden
        </figcaption>
        <p className="mt-0.5 text-xs text-neutral-500 sm:mt-1 sm:text-[13px]">
          Jun 8, 2025
        </p>
      </figure>

      <div
        className={`absolute bottom-0 left-[8%] w-[84%] overflow-hidden rounded-xl border border-line bg-white text-ink sm:left-[14%] sm:w-[78%] ${shadow}`}
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#cbc8c1] text-xs font-semibold">
            AC
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Ana Cruz</p>
            <p className="text-xs text-neutral-500">2 years ago · Friends</p>
          </div>
        </div>
        <div className="p-4">
          <p className="font-serif text-xl leading-tight sm:text-[22px]">
            Graduation trip with the barkada
          </p>
          <p className="mt-2 hidden font-serif leading-snug text-neutral-600 sm:block">
            Five of us, one van, and the last trip before everyone moved cities.
          </p>
          <p className="mt-3 flex gap-4 text-[13px] text-neutral-600">
            <span>12 likes</span>
            <span>3 comments</span>
          </p>
        </div>
      </div>
    </div>
  );
}
