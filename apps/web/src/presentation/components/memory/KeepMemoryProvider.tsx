import { useCallback, useState, type ReactNode } from "react";
import { useAuth } from "../../../application/auth/useAuth";
import type { Memory } from "../../../domain/memory";
import { DeleteMemoryDialog } from "./DeleteMemoryDialog";
import { KeepMemoryContext, type SavedMemory } from "./KeepMemoryContext";
import { KeepMemoryDialog } from "./KeepMemoryDialog";

export function KeepMemoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const [lastSaved, setLastSaved] = useState<SavedMemory | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Memory | null>(null);

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
  const clearLastSaved = useCallback(() => setLastSaved(null), []);
  const clearLastDeleted = useCallback(() => setLastDeleted(null), []);

  function handleSaved(memory: Memory) {
    if (editing) {
      setLastSaved({ memory, mode: "updated" }); // the API sends the author on edits
    } else {
      // The create response has no author; we know it's the logged-in user
      const author = user
        ? {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhotoUrl: user.profilePhotoUrl,
          }
        : undefined;
      setLastSaved({ memory: { ...memory, author }, mode: "created" });
    }
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleDeleted(memory: Memory) {
    setLastDeleted(memory);
    setDeleting(null);
  }

  return (
    <KeepMemoryContext.Provider
      value={{
        openKeepMemory,
        openEditMemory,
        openDeleteMemory,
        lastSaved,
        clearLastSaved,
        lastDeleted,
        clearLastDeleted,
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
