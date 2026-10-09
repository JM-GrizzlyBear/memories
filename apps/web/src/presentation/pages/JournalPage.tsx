import { ImagePlus } from "lucide-react";
import { useJournal } from "../../application/memory/useJournal";
import { MemoryList } from "../components/memory/MemoryList";
import { Notice } from "../components/memory/Notice";
import { useKeepMemory } from "../components/memory/useKeepMemory";
import { useSyncWithMemoryDialogs } from "../components/memory/useSyncWithMemoryDialogs";

export function JournalPage() {
  const journal = useJournal();
  const { openKeepMemory } = useKeepMemory();
  const notice = useSyncWithMemoryDialogs(journal);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <div className="border-b border-ink pb-4">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          The journal
        </h1>
        <p className="mt-1 text-neutral-500">
          Your memories, your friends', and the ones shared with everyone.
        </p>
      </div>

      <Notice text={notice} />

      <MemoryList
        journal={journal}
        endText="That's the beginning of your journal."
        empty={
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
        }
      />
    </main>
  );
}
