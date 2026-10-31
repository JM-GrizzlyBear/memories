import { Info } from "lucide-react";
import { useId } from "react";

// The live portfolio site runs on free hosting that can't send email, so instead of
// a form that never delivers, it says so. Hover (or focus) "Why?" for the details.
export function ResetUnavailableNotice() {
  const tooltipId = useId();

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-semibold">
        Password reset isn't available on this site yet
      </p>
      <p className="mt-1 leading-relaxed">
        This is a portfolio project on free hosting, which can't send email. It
        works when you run the project on your own computer.
      </p>
      <div className="group relative mt-3 inline-block">
        <button
          type="button"
          aria-describedby={tooltipId}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md font-medium underline underline-offset-4
            focus-visible:outline-2 focus-visible:outline-amber-900"
        >
          <Info size={16} aria-hidden="true" />
          Why?
        </button>
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none invisible absolute top-full left-0 z-10 mt-2 w-72 rounded-md bg-neutral-900
            px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition
            group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
        >
          We're using free plans for this portfolio: Render's free plan blocks
          sending email, and free email services need a paid domain to email
          anyone. Locally, every email lands in Mailpit (localhost:8025).
        </span>
      </div>
    </div>
  );
}
