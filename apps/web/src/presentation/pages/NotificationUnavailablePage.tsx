import { Link } from "react-router";

// Where a notification leads when what it pointed to is gone
export function NotificationUnavailablePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 text-center sm:px-6">
      <p className="font-serif text-3xl">This isn't available anymore</p>
      <p className="mt-2 max-w-md text-neutral-500">
        The friend request may have been cancelled, or the memory or comment
        deleted.
      </p>
      <Link
        to="/notifications"
        className="mt-6 flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        Back to notifications
      </Link>
    </main>
  );
}
