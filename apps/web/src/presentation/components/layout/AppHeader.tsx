import { Plus } from "lucide-react";
import { Link } from "react-router";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="font-serif text-2xl font-medium tracking-tight">
          Memories
        </Link>

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
