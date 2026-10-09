import { useContext } from "react";
import { KeepMemoryContext } from "./KeepMemoryContext";

export function useKeepMemory() {
  const context = useContext(KeepMemoryContext);
  if (!context) {
    throw new Error("useKeepMemory must be used inside <KeepMemoryProvider>");
  }
  return context;
}
