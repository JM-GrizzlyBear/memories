import type { ComponentProps, ReactNode } from "react";

interface InputProps extends ComponentProps<"input"> {
  id: string; // required: every input must have a unique id
  label: string;
  error?: string;
  endAdornment?: ReactNode; // optional element shown inside the input, on the right
}

export function Input({
  id,
  label,
  error,
  endAdornment,
  className = "",
  ...props
}: InputProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-900">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-11 w-full rounded-md border bg-white px-3 text-sm text-neutral-900 outline-none transition
            placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900
            ${endAdornment ? "pr-11" : ""}
            ${error ? "border-red-600" : "border-neutral-300"} ${className}`}
          {...props}
        />

        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {endAdornment}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
