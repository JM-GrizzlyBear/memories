import { createContext } from "react";
import type { Memory } from "../../../domain/memory";

export interface KeepMemoryContextValue {
  openKeepMemory: () => void;
  openEditMemory: (memory: Memory) => void;
  openDeleteMemory: (memory: Memory) => void;
  // What just happened ("… was updated."), shown on the page where it happened
  notice: string | null;
}

export const KeepMemoryContext = createContext<KeepMemoryContextValue | null>(
  null,
);
