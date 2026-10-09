import { LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../../application/auth/useAuth";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  // While open: move focus into the menu, close on Escape or a click outside
  useEffect(() => {
    if (!isOpen) return;

    firstItemRef.current?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus(); // give focus back to where it came from
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      // No navigate needed: user becomes null, so ProtectedRoute sends us to /login
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!user) return null;

  const initials =
    `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="user-menu"
        aria-label="Account menu"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-300 text-sm font-semibold text-ink transition
          hover:ring-2 hover:ring-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      >
        {initials}
      </button>

      {isOpen && (
        <div
          id="user-menu"
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-64 rounded-md border border-line bg-white p-2 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="font-semibold text-ink">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-neutral-500">@{user.username}</p>
          </div>

          <div className="my-1 border-t border-line" />

          <Link
            ref={firstItemRef}
            to={`/u/${user.username}`}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex min-h-11 w-full items-center gap-2.5 rounded px-3 text-left text-sm text-ink transition
              hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none"
          >
            <UserRound size={16} aria-hidden="true" />
            Your profile
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex min-h-11 w-full items-center gap-2.5 rounded px-3 text-left text-sm text-ink transition
              hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={16} aria-hidden="true" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
