import { createContext } from "react";
import type { Memory } from "../../../domain/memory";

export interface KeepMemoryContextValue {
  openKeepMemory: () => void;
  openEditMemory: (memory: Memory) => void;
  openDeleteMemory: (memory: Memory) => void;
}

export const KeepMemoryContext = createContext<KeepMemoryContextValue | null>(
  null,
);
