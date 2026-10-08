import type { ComponentProps, ReactNode } from "react";

interface TextAreaProps extends ComponentProps<"textarea"> {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode; // small text on the right of the label, like a character count
}

export function TextArea({
  id,
  label,
  error,
  hint,
  className = "",
  ...props
}: TextAreaProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-neutral-900">
          {label}
        </label>
        {hint && (
          <span id={hintId} className="text-xs text-neutral-500">
            {hint}
          </span>
        )}
      </div>

      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`resize-y rounded-md border bg-white px-3.5 py-3 font-serif text-lg leading-relaxed text-neutral-900 outline-none transition
          placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900
          ${error ? "border-red-600" : "border-neutral-300"} ${className}`}
        {...props}
      />

      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
