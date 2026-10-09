import { Check, ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../application/auth/useAuth";
import { useJournal } from "../../application/memory/useJournal";
import { MemoryCard } from "../components/memory/MemoryCard";
import { useKeepMemory } from "../components/memory/useKeepMemory";

function MemorySkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-[64px_minmax(0,1fr)] gap-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-6">
      <div className="mx-auto h-24 w-12 rounded bg-neutral-200" />
      <div className="overflow-hidden rounded-md border border-line bg-white">
        <div className="h-14" />
        <div className="aspect-[4/3] bg-neutral-200" />
        <div className="space-y-3 p-6">
          <div className="h-7 w-2/3 rounded bg-neutral-200" />
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-4 w-5/6 rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

export function JournalPage() {
  const { user } = useAuth();
  const journal = useJournal();
  const { openKeepMemory, lastKept, clearLastKept } = useKeepMemory();
  const [keptTitle, setKeptTitle] = useState<string | null>(null);

  // A memory was just kept in the dialog: show it on top right away
  const { prepend } = journal;
  useEffect(() => {
    if (!lastKept) return;
    prepend(lastKept);
    setKeptTitle(lastKept.title);
    clearLastKept(); // handled, so it doesn't show again later
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lastKept, prepend, clearLastKept]);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <div className="border-b border-ink pb-4">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          The journal
        </h1>
        <p className="mt-1 text-neutral-500">
          Your memories, and the ones shared with everyone.
        </p>
      </div>

      <div role="status">
        {keptTitle && (
          <p className="mt-6 flex items-center gap-2.5 rounded-md border border-neutral-900 bg-white px-4 py-3 text-sm">
            <Check size={18} aria-hidden="true" />
            <span>
              <span className="font-semibold">Memory kept.</span> &ldquo;
              {keptTitle}&rdquo; is now in your journal.
            </span>
          </p>
        )}
      </div>

      {journal.status === "loading" && (
        <div className="mt-10 space-y-12" aria-label="Loading memories">
          <MemorySkeleton />
          <MemorySkeleton />
        </div>
      )}

      {journal.status === "error" && (
        <div className="mt-16 text-center">
          <p className="font-serif text-2xl">Couldn't load your journal</p>
          <p className="mt-1 text-neutral-500">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={journal.retry}
            className="mt-6 h-11 rounded-full border border-neutral-900 px-6 text-sm font-medium transition hover:bg-neutral-900 hover:text-white"
          >
            Try again
          </button>
        </div>
      )}

      {journal.status === "ready" && journal.memories.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <ImagePlus size={36} strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-4 font-serif text-3xl">Start your journal</p>
          <p className="mt-2 max-w-sm text-neutral-500">
            Keep your first memory: a few photos and the story of why it
            mattered.
          </p>
          <button
            type="button"
            onClick={openKeepMemory}
            className="mt-6 flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Keep a memory
          </button>
        </div>
      )}

      {journal.status === "ready" && journal.memories.length > 0 && (
        <>
          <ol className="mt-10 space-y-12">
            {journal.memories.map((memory) => (
              <li key={memory.id}>
                <MemoryCard memory={memory} currentUserId={user?.id ?? ""} />
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-col items-center gap-2">
            {journal.hasMore ? (
              <button
                type="button"
                onClick={journal.loadMore}
                disabled={journal.isLoadingMore}
                className="h-11 rounded-full border border-neutral-900 px-6 text-sm font-medium transition hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {journal.isLoadingMore ? "Loading..." : "Show older memories"}
              </button>
            ) : (
              <p className="text-sm text-neutral-500">
                That's the beginning of your journal.
              </p>
            )}
            {journal.loadMoreFailed && (
              <p role="alert" className="text-sm text-red-600">
                Couldn't load more. Try again.
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
