import type { ComponentProps } from "react";

interface InputProps extends ComponentProps<"input"> {
  id: string; // required: every input must have a unique id
  label: string;
  error?: string;
}

export function Input({
  id,
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-900">
        {label}
      </label>

      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-11 rounded-md border bg-white px-3 text-sm text-neutral-900 outline-none transition
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
