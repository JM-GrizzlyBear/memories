import { createContext } from "react";
import type { Memory } from "../../../domain/memory";

export interface KeepMemoryContextValue {
  openKeepMemory: () => void;
  lastKept: Memory | null; // the memory saved most recently, until someone handles it
  clearLastKept: () => void;
}

export const KeepMemoryContext = createContext<KeepMemoryContextValue | null>(
  null,
);
