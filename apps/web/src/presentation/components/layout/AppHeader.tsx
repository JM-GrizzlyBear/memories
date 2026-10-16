import { Bell, BookOpen, MessageCircle, Plus, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { useMessageCounts } from "../../../application/conversation/useConversations";
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
  className = "",
  end = true,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  badgeLabel?: [one: string, many: string]; // read out after the number
  className?: string;
  end?: boolean; // false: also active on pages under it (/messages/c/…)
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative h-11 items-center gap-2 rounded-full px-2.5 text-sm transition sm:px-4 ${className || "flex"} ${
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
  const messageCounts = useMessageCounts();
  const messageBadge = messageCounts.unread + messageCounts.requests;

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
              to="/messages"
              end={false}
              icon={<MessageCircle size={20} aria-hidden="true" />}
              label="Messages"
              badge={messageBadge}
              badgeLabel={[
                " chat with something new",
                " chats with something new",
              ]}
            />
            {/* Phones: Notifications moves into the account menu, to keep the header clean */}
            <HeaderLink
              to="/notifications"
              icon={<Bell size={20} aria-hidden="true" />}
              label="Notifications"
              badge={unreadCount}
              badgeLabel={[" unread notification", " unread notifications"]}
              className="hidden sm:flex"
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
