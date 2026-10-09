import type { ReactNode } from "react";
import { Link } from "react-router";
import type { UserSummary } from "../../../domain/friendship";
import { Avatar } from "./Avatar";

interface PersonRowProps {
  person: UserSummary;
  detail?: ReactNode; // a small line under the name, like "Friends since May 2024"
  children?: ReactNode; // the buttons on the right
}

// One person in a list: photo, name (opens their profile), and actions
export function PersonRow({ person, detail, children }: PersonRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap">
      <Link
        to={`/u/${person.username}`}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      >
        <Avatar user={person} size="md" />
        <span className="min-w-0">
          <span className="block truncate font-semibold group-hover:underline group-hover:underline-offset-4">
            {person.firstName} {person.lastName}
          </span>
          <span className="block truncate text-sm text-neutral-500">
            @{person.username}
            {detail && <> · {detail}</>}
          </span>
        </span>
      </Link>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </li>
  );
}
