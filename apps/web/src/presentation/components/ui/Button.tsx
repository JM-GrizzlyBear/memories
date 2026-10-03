import type { ComponentProps } from "react";

// Everything a normal <button> accepts, plus a loading state
interface ButtonProps extends ComponentProps<"button"> {
  isLoading?: boolean;
}

export function Button({
  isLoading = false,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      // Disabled while loading, so nobody submits twice
      disabled={disabled || isLoading}
      className={`h-11 w-full rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition
        hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900
        disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {isLoading ? "Please wait..." : children}
    </button>
  );
}
