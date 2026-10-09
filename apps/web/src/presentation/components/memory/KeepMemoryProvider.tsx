import { useCallback, useState, type ReactNode } from "react";
import { useAuth } from "../../../application/auth/useAuth";
import type { Memory } from "../../../domain/memory";
import { KeepMemoryContext } from "./KeepMemoryContext";
import { KeepMemoryDialog } from "./KeepMemoryDialog";

export function KeepMemoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [lastKept, setLastKept] = useState<Memory | null>(null);

  const openKeepMemory = useCallback(() => setIsOpen(true), []);
  const clearLastKept = useCallback(() => setLastKept(null), []);

  function handleKept(memory: Memory) {
    // The create response has no author; we know it's the logged-in user
    setLastKept(
      user
        ? {
            ...memory,
            author: {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePhotoUrl: user.profilePhotoUrl,
            },
          }
        : memory,
    );
    setIsOpen(false);
  }

  return (
    <KeepMemoryContext.Provider
      value={{ openKeepMemory, lastKept, clearLastKept }}
    >
      {children}
      <KeepMemoryDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onKept={handleKept}
      />
    </KeepMemoryContext.Provider>
  );
}
