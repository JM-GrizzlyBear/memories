import { useEffect, useState } from "react";
import type { Memory } from "../../../domain/memory";
import { useKeepMemory } from "./useKeepMemory";

interface MemoryList {
  prepend: (memory: Memory) => void;
  replace: (memory: Memory) => void;
  remove: (id: string) => void;
}

// Keeps a list of memories in step with the Keep / Edit / Delete dialogs,
// and returns a short notice saying what just happened.
// belongsHere: should a newly kept memory appear in this list?
export function useSyncWithMemoryDialogs(
  list: MemoryList,
  belongsHere: (memory: Memory) => boolean = () => true,
) {
  const { lastSaved, clearLastSaved, lastDeleted, clearLastDeleted } =
    useKeepMemory();
  const [notice, setNotice] = useState<string | null>(null);
  const { prepend, replace, remove } = list;

  // A memory was kept or edited in the dialog: show the change right away
  useEffect(() => {
    if (!lastSaved) return;
    if (lastSaved.mode === "created") {
      if (belongsHere(lastSaved.memory)) {
        prepend(lastSaved.memory);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setNotice(`"${lastSaved.memory.title}" is now in your journal.`);
    } else {
      replace(lastSaved.memory);
      setNotice(`"${lastSaved.memory.title}" was updated.`);
    }
    clearLastSaved();
  }, [lastSaved, prepend, replace, clearLastSaved, belongsHere]);

  // A memory was deleted: take it off the page
  useEffect(() => {
    if (!lastDeleted) return;
    remove(lastDeleted.id);
    setNotice(`"${lastDeleted.title}" was deleted.`);
    clearLastDeleted();
  }, [lastDeleted, remove, clearLastDeleted]);

  return notice;
}
