import type { ReactNode } from "react";
import { useAuth } from "../../../application/auth/useAuth";
import type { useJournal } from "../../../application/memory/useJournal";
import { MemoryCard } from "./MemoryCard";

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

interface MemoryListProps {
  journal: ReturnType<typeof useJournal>;
  empty: ReactNode; // what to show when there are no memories
  endText: string; // shown under the last page
}

// The timeline of memory cards with loading, error, empty and "show older" states.
// Used by the Journal and by profiles.
export function MemoryList({ journal, empty, endText }: MemoryListProps) {
  const { user } = useAuth();

  if (journal.status === "loading") {
    return (
      <div className="mt-10 space-y-12" aria-label="Loading memories">
        <MemorySkeleton />
        <MemorySkeleton />
      </div>
    );
  }

  if (journal.status === "error") {
    return (
      <div className="mt-16 text-center">
        <p className="font-serif text-2xl">Couldn't load these memories</p>
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
    );
  }

  if (journal.memories.length === 0) return <>{empty}</>;

  return (
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
          <p className="text-sm text-neutral-500">{endText}</p>
        )}
        {journal.loadMoreFailed && (
          <p role="alert" className="text-sm text-red-600">
            Couldn't load more. Try again.
          </p>
        )}
      </div>
    </>
  );
}
