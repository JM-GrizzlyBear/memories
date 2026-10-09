import { createContext } from "react";
import type { Memory } from "../../../domain/memory";

export interface SavedMemory {
  memory: Memory;
  mode: "created" | "updated";
}

export interface KeepMemoryContextValue {
  openKeepMemory: () => void;
  openEditMemory: (memory: Memory) => void;
  openDeleteMemory: (memory: Memory) => void;
  lastSaved: SavedMemory | null; // until someone handles it
  clearLastSaved: () => void;
  lastDeleted: Memory | null;
  clearLastDeleted: () => void;
}

export const KeepMemoryContext = createContext<KeepMemoryContextValue | null>(
  null,
);
