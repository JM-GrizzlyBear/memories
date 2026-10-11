import { Check } from "lucide-react";

// A problem with the whole form (not one field)
export function FormError({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {text}
    </p>
  );
}

// "Saved" message, announced to screen readers
export function FormSuccess({ text }: { text: string | null }) {
  return (
    <div role="status">
      {text && (
        <p className="flex items-center gap-2 text-sm text-ink">
          <Check size={16} aria-hidden="true" />
          {text}
        </p>
      )}
    </div>
  );
}
