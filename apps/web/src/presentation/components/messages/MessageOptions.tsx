import { MoreHorizontal, Pencil, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 176;
const GAP = 6;
const EDGE = 8;

interface MessageOptionsProps {
  canEdit: () => boolean; // asked when the menu opens (editing ends after 22 minutes)
  onEdit: () => void;
  onUnsend: () => void;
}

// The "⋯" next to your own message. Its menu floats above everything, like
// Messenger's, so a small chat window never cuts it off.
export function MessageOptions({
  canEdit,
  onEdit,
  onUnsend,
}: MessageOptionsProps) {
  const [menu, setMenu] = useState<{
    canEdit: boolean;
    left: number;
    bottom: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function open() {
    const button = buttonRef.current;
    if (!button) return;
    const box = button.getBoundingClientRect();
    // Above the button, centered on it, and always inside the screen
    const left = Math.min(
      Math.max(box.left + box.width / 2 - MENU_WIDTH / 2, EDGE),
      window.innerWidth - MENU_WIDTH - EDGE,
    );
    setMenu({
      canEdit: canEdit(),
      left,
      bottom: window.innerHeight - box.top + GAP,
    });
  }

  // Closes on a click outside, Escape, scrolling or resizing
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close();
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  const item =
    "flex min-h-10 w-full items-center gap-2 rounded px-3 text-left text-sm hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Message options"
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        onClick={() => (menu ? setMenu(null) : open())}
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 opacity-0 transition hover:bg-neutral-200 hover:text-ink focus:opacity-100 group-hover:opacity-100 aria-expanded:bg-neutral-200 aria-expanded:opacity-100 [@media(hover:none)]:opacity-60"
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>

      {menu &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ left: menu.left, bottom: menu.bottom, width: MENU_WIDTH }}
            className="fixed z-50 rounded-xl border border-line bg-white p-1 shadow-xl"
          >
            {menu.canEdit && (
              <button
                type="button"
                role="menuitem"
                autoFocus
                onClick={() => {
                  setMenu(null);
                  onEdit();
                }}
                className={item}
              >
                <Pencil size={15} aria-hidden="true" />
                Edit
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              autoFocus={!menu.canEdit}
              onClick={() => {
                setMenu(null);
                onUnsend();
              }}
              className={`${item} text-red-700`}
            >
              <Undo2 size={15} aria-hidden="true" />
              Unsend
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
