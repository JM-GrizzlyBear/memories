import { Bell, BookOpen, Plus, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { useIncomingRequestCount } from "../../../application/friendship/useIncomingRequestCount";
import { useUnreadNotificationCount } from "../../../application/notification/useNotifications";
import { useKeepMemory } from "../memory/useKeepMemory";
import { UserMenu } from "./UserMenu";

function HeaderLink({
  to,
  icon,
  label,
  badge = 0,
  badgeLabel = ["", ""],
}: {
  to: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  badgeLabel?: [one: string, many: string]; // read out after the number
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `relative flex h-11 items-center gap-2 rounded-full px-2.5 text-sm transition sm:px-4 ${
          isActive
            ? "bg-neutral-900 font-medium text-white"
            : "text-neutral-600 hover:text-ink"
        }`
      }
    >
      {/* On phones only the icon shows; the label stays for screen readers */}
      <span className="sm:hidden">{icon}</span>
      <span className="sr-only sm:not-sr-only">{label}</span>
      {badge > 0 && (
        // Phones: a small count on the icon's corner. Larger screens: next to the label.
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-semibold tabular-nums text-white sm:static sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-xs">
          {badge}
          <span className="sr-only">
            {badge === 1 ? badgeLabel[0] : badgeLabel[1]}
          </span>
        </span>
      )}
    </NavLink>
  );
}

export function AppHeader() {
  const { openKeepMemory } = useKeepMemory();
  const requestCount = useIncomingRequestCount();
  const unreadCount = useUnreadNotificationCount();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          <Link
            to="/"
            className="font-serif text-2xl font-medium tracking-tight"
          >
            Memories
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            <HeaderLink
              to="/"
              icon={<BookOpen size={20} aria-hidden="true" />}
              label="Journal"
            />
            <HeaderLink
              to="/friends"
              icon={<Users size={20} aria-hidden="true" />}
              label="Friends"
              badge={requestCount}
              badgeLabel={[" friend request", " friend requests"]}
            />
            <HeaderLink
              to="/notifications"
              icon={<Bell size={20} aria-hidden="true" />}
              label="Notifications"
              badge={unreadCount}
              badgeLabel={[" unread notification", " unread notifications"]}
            />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openKeepMemory}
            aria-label="Keep a memory"
            aria-haspopup="dialog"
            className="flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 sm:px-5"
          >
            <Plus size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Keep a memory</span>
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
