import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string; // a short line under the label
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  label: string; // read by screen readers (the button shows the chosen option)
  disabled?: boolean;
  align?: "left" | "right"; // which edge the list lines up with
}

const GAP = 6;
const EDGE = 8;
const LIST_WIDTH = 240;

// Our own dropdown: a pill button and a floating list in the app's style.
// Works with the keyboard like a real select (arrows, Home/End, Enter, Escape),
// and floats above dialogs and chat windows so nothing cuts it off.
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled = false,
  align = "right",
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0); // the highlighted option
  const [position, setPosition] = useState<{
    left: number;
    top?: number;
    bottom?: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  function open() {
    if (disabled) return;
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      ),
    );
    setIsOpen(true);
  }

  function close(focusButton = true) {
    setIsOpen(false);
    setPosition(null);
    if (focusButton) buttonRef.current?.focus();
  }

  function choose(index: number) {
    const option = options[index];
    close();
    if (option && option.value !== value) onChange(option.value);
  }

  // Place the list under the button (or above it when there's no room), on screen
  useLayoutEffect(() => {
    if (!isOpen) return;
    const button = buttonRef.current?.getBoundingClientRect();
    const list = listRef.current;
    if (!button || !list) return;
    const height = list.offsetHeight;
    const left = Math.min(
      Math.max(
        align === "right" ? button.right - LIST_WIDTH : button.left,
        EDGE,
      ),
      window.innerWidth - LIST_WIDTH - EDGE,
    );
    const fitsBelow = button.bottom + GAP + height <= window.innerHeight - EDGE;
    setPosition(
      fitsBelow
        ? { left, top: button.bottom + GAP }
        : { left, bottom: window.innerHeight - button.top + GAP },
    );
  }, [isOpen, align]);

  // Once it's placed (and visible), the keyboard moves into the list
  useEffect(() => {
    if (position) listRef.current?.focus();
  }, [position]);

  // A click outside, scrolling or resizing closes it
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        listRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return;
      close(false);
    };
    const onScroll = (event: Event) => {
      if (listRef.current?.contains(event.target as Node)) return;
      close(false);
    };
    const onResize = () => close(false);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]);

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      open();
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const last = options.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((index) => Math.min(index + 1, last)),
      ArrowUp: () => setActive((index) => Math.max(index - 1, 0)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => close(),
      Tab: () => close(),
    };
    const action = keys[event.key];
    if (!action) return;
    // Escape closes only the list, not the dialog around it
    if (event.key !== "Tab") event.preventDefault();
    event.stopPropagation();
    action();
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-label={`${label}: ${selected?.label ?? ""}`}
        className="flex h-10 items-center gap-1.5 rounded-full border border-neutral-300 bg-white pl-4 pr-3 text-sm font-medium transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60 aria-expanded:border-ink"
      >
        {selected?.label}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`text-neutral-500 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        // "fixed" so a scrolling dialog or a small window never cuts it off.
        // Hidden until placed, so it doesn't flash in the wrong spot.
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKeyDown}
          style={{
            width: LIST_WIDTH,
            left: position?.left ?? 0,
            top: position?.top,
            bottom: position?.bottom,
            visibility: position ? "visible" : "hidden",
          }}
          className="fixed z-50 rounded-xl border border-line bg-white p-1.5 shadow-xl outline-none"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 ${
                  index === active ? "bg-neutral-100" : ""
                }`}
              >
                <span className="mt-0.5 w-4 shrink-0">
                  {isSelected && <Check size={16} aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      {option.description}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
