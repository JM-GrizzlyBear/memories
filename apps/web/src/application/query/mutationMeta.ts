// Extra settings any mutation can carry (TanStack Query calls this "meta").
// The error toasts read them: see presentation/components/ui/ErrorToasts.tsx
// (A "type", not an "interface": TanStack Query only accepts it as a plain record)
export type MutationErrorMeta = {
  // false: this mutation shows its own errors (like the login form)
  errorToast?: boolean;
  // A clearer message for this action; return null to use the usual one
  errorMessage?: string | ((error: unknown) => string | null);
};

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: MutationErrorMeta;
  }
}
