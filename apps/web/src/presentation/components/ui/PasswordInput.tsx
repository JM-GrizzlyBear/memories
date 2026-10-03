import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";

// Same props as Input, except `type` and `endAdornment`, which this component controls
type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type" | "endAdornment">;

export function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      {...props}
      type={isVisible ? "text" : "password"}
      endAdornment={
        <button
          type="button" // important: a plain button inside a form would submit it!
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="flex h-8 w-8 items-center justify-center rounded text-neutral-500 transition
            hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900"
        >
          {isVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      }
    />
  );
}