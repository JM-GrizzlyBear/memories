import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Memory } from "../../../domain/memory";
import { useKeepMemory } from "./useKeepMemory";

// The ⋯ menu on your own memories
export function MemoryActionsMenu({ memory }: { memory: Memory }) {
  const { openEditMemory, openDeleteMemory } = useKeepMemory();
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const menuId = `memory-menu-${memory.id}`;

  // While open: focus the first item, close on Escape or a click outside
  useEffect(() => {
    if (!isOpen) return;

    firstItemRef.current?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node))
        setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function choose(action: () => void) {
    setIsOpen(false);
    action();
  }

  const itemClass =
    "flex min-h-11 w-full items-center gap-2.5 rounded px-3 text-left text-sm transition hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Options for ${memory.title}`}
        className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-neutral-900"
      >
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border border-line bg-white p-1.5 shadow-lg"
        >
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            onClick={() => choose(() => openEditMemory(memory))}
            className={`${itemClass} text-ink`}
          >
            <Pencil size={16} aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(() => openDeleteMemory(memory))}
            className={`${itemClass} text-red-700`}
          >
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
