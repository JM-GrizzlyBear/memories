import { Calendar } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Input } from "./Input";

interface DateInputProps {
  id: string;
  name: string;
  label: string;
  value: string; // "YYYY-MM-DD", the format the API uses
  onChange: (isoDate: string) => void; // "" when the typed date is incomplete or impossible
  max?: string; // "YYYY-MM-DD"
  error?: string;
}

// "1998-01-10" → "10-01-1998"
function isoToDisplay(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

// Typing "10011998" → "10-01-1998": the dashes are added for you
function formatTyping(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

// "10-01-1998" → "1998-01-10", or "" if it isn't a complete, real date
function displayToIso(text: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text);
  if (!match) return "";

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;

  // Round-trip through Date: "2024-02-31" would come back as "2024-03-02", so it's rejected
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === iso
    ? iso
    : "";
}

// A date field that always reads dd-mm-yyyy, whatever the browser's language
export function DateInput({
  id,
  name,
  label,
  value,
  onChange,
  max,
  error,
}: DateInputProps) {
  const [text, setText] = useState(() => isoToDisplay(value));
  const pickerRef = useRef<HTMLInputElement>(null);

  function handleTyping(event: ChangeEvent<HTMLInputElement>) {
    const formatted = formatTyping(event.target.value);
    setText(formatted);
    onChange(displayToIso(formatted));
  }

  function handlePicked(event: ChangeEvent<HTMLInputElement>) {
    const iso = event.target.value; // the browser's picker always gives "YYYY-MM-DD"
    setText(isoToDisplay(iso));
    onChange(iso);
  }

  function openPicker() {
    const picker = pickerRef.current;
    if (!picker) return;
    try {
      picker.showPicker(); // opens the browser's calendar
    } catch {
      picker.focus(); // very old browsers: at least do something
    }
  }

  return (
    <Input
      id={id}
      name={name}
      label={label}
      type="text"
      inputMode="numeric" // number keyboard on phones
      autoComplete="off"
      placeholder="dd-mm-yyyy"
      maxLength={10}
      value={text}
      onChange={handleTyping}
      error={error}
      endAdornment={
        <>
          <button
            type="button"
            onClick={openPicker}
            aria-label="Choose a date from the calendar"
            className="flex h-8 w-8 items-center justify-center rounded text-neutral-500 transition hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900"
          >
            <Calendar size={18} aria-hidden="true" />
          </button>
          {/* The browser's own date picker, kept invisible: only its calendar popup is used */}
          <input
            ref={pickerRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            max={max}
            value={displayToIso(text)}
            onChange={handlePicked}
            className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
          />
        </>
      }
    />
  );
}
