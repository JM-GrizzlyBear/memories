import { useCallback, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Memory } from "../../../domain/memory";
import { DeleteMemoryDialog } from "./DeleteMemoryDialog";
import { KeepMemoryContext } from "./KeepMemoryContext";
import { KeepMemoryDialog } from "./KeepMemoryDialog";

// The Keep / Edit / Delete dialogs, available on every logged-in page.
// The lists update themselves (the cache changes); this opens the dialogs
// and says what happened with a toast.
export function KeepMemoryProvider({ children }: { children: ReactNode }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);

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

  function handleSaved(memory: Memory) {
    if (editing) {
      toast.success("Memory updated", { description: memory.title });
    } else {
      toast.success("Memory kept", {
        description: `"${memory.title}" is now in your journal.`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" }); // new memories are at the top
    }
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleDeleted(memory: Memory) {
    toast.success("Memory deleted", { description: memory.title });
    setDeleting(null);
  }

  return (
    <KeepMemoryContext.Provider
      value={{ openKeepMemory, openEditMemory, openDeleteMemory }}
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
