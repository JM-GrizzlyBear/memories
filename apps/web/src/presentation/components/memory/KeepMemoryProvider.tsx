import { useCallback, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import type { Memory } from "../../../domain/memory";
import { DeleteMemoryDialog } from "./DeleteMemoryDialog";
import { KeepMemoryContext } from "./KeepMemoryContext";
import { KeepMemoryDialog } from "./KeepMemoryDialog";

interface Notice {
  text: string;
  path: string; // the page it belongs to
}

// The Keep / Edit / Delete dialogs, available on every logged-in page.
// The lists update themselves (the cache changes); this only opens dialogs and says what happened.
export function KeepMemoryProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const openKeepMemory = useCallback(() => {
    setEditing(null);
    setIsFormOpen(true);
  }, []);

  const openEditMemory = useCallback((memory: Memory) => {
    setEditing(memory);
    setIsFormOpen(true);
  }, []);

  const openDeleteMemory = useCallback(
    (memory: Memory) => setDeleting(memory),
    [],
  );

  function say(text: string) {
    setNotice({ text, path: location.pathname });
  }

  function handleSaved(memory: Memory) {
    if (editing) {
      say(`"${memory.title}" was updated.`);
    } else {
      say(`"${memory.title}" is now in your journal.`);
      window.scrollTo({ top: 0, behavior: "smooth" }); // new memories are at the top
    }
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleDeleted(memory: Memory) {
    say(`"${memory.title}" was deleted.`);
    setDeleting(null);
  }

  return (
    <KeepMemoryContext.Provider
      value={{
        openKeepMemory,
        openEditMemory,
        openDeleteMemory,
        // Moving to another page leaves the notice behind
        notice: notice?.path === location.pathname ? notice.text : null,
      }}
    >
      {children}
      <KeepMemoryDialog
        open={isFormOpen}
        memory={editing}
        onClose={() => {
          setIsFormOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />
      <DeleteMemoryDialog
        memory={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={handleDeleted}
      />
    </KeepMemoryContext.Provider>
  );
}
