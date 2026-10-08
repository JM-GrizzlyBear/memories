import type { Visibility } from "../../../domain/memory";

const OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: "public", label: "Everyone", hint: "Anyone on Memories" },
  { value: "friends", label: "Friends", hint: "Only your friends" },
  { value: "private", label: "Only me", hint: "A private keepsake" },
];

interface VisibilityPickerProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
  error?: string;
}

export function VisibilityPicker({
  value,
  onChange,
  error,
}: VisibilityPickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-neutral-900">
        Who can see it?
      </legend>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <label key={option.value} className="cursor-pointer">
              {/* Real radio buttons: arrow keys and screen readers work for free */}
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                className={`flex min-h-16 flex-col justify-center rounded-md border px-3.5 py-2.5 transition
                  peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-900
                  ${isSelected ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900"}`}
              >
                <span className="text-sm font-semibold">{option.label}</span>
                <span
                  className={`mt-0.5 text-xs ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}
                >
                  {option.hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}
