import { useSyncExternalStore } from "react";

// true while the screen matches, e.g. useMediaQuery("(min-width: 1024px)")
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
  );
}
