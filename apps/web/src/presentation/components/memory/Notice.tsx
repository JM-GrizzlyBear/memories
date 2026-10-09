import { Check } from "lucide-react";

// The "what just happened" line under a page title (announced to screen readers)
export function Notice({ text }: { text: string | null }) {
  return (
    <div role="status">
      {text && (
        <p className="mt-6 flex items-center gap-2.5 rounded-md border border-neutral-900 bg-white px-4 py-3 text-sm">
          <Check size={18} aria-hidden="true" />
          <span>{text}</span>
        </p>
      )}
    </div>
  );
}
