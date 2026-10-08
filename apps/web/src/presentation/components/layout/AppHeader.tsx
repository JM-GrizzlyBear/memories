import { Plus } from "lucide-react";
import { Link, NavLink } from "react-router";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="font-serif text-2xl font-medium tracking-tight"
          >
            Memories
          </Link>
          <nav aria-label="Main" className="hidden sm:block">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex h-11 items-center rounded-full px-4 text-sm transition ${
                  isActive
                    ? "bg-neutral-900 font-medium text-white"
                    : "text-neutral-600 hover:text-ink"
                }`
              }
            >
              Journal
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/memories/new"
            aria-label="Keep a memory"
            className="flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 sm:px-5"
          >
            <Plus size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Keep a memory</span>
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
