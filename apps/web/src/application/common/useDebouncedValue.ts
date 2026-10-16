import { useEffect, useState } from "react";

// The value, but only after it stopped changing for `delayMs`
// (e.g. search when typing pauses, not on every key)
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
