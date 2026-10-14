import { Settings } from "lucide-react";
import { Link, NavLink, useParams } from "react-router";
import { useAlbum } from "../../application/album/useAlbum";
import { useJournal } from "../../application/memory/useJournal";
import { useProfile } from "../../application/user/useProfile";
import type { FriendshipStatus, Profile } from "../../domain/friendship";
import { AlbumView } from "../components/album/AlbumView";
import { FriendshipActions } from "../components/friendship/FriendshipActions";
import { MessageButton } from "../components/messages/MessageButton";
import { MemoryList } from "../components/memory/MemoryList";
import { Avatar } from "../components/user/Avatar";
import { monthYear } from "../format/dates";

// What you see of someone depends on how you relate to them
function emptyText(friendship: FriendshipStatus, firstName: string) {
  switch (friendship) {
    case "self":
      return "You haven't kept any memories yet.";
    case "friends":
      return `${firstName} hasn't shared any memories with you yet.`;
    default:
      return `${firstName} hasn't shared any memories with everyone. Become friends to see the ones they keep for friends.`;
  }
}

// The memories part. Friend actions refresh it by themselves (see useFriendship).
function ProfileMemories({ profile }: { profile: Profile }) {
  const journal = useJournal(profile.id);

  return (
    <MemoryList
      journal={journal}
      endText={
        profile.friendship === "self"
          ? "That's your very first memory."
          : `That's everything ${profile.firstName} has shared with you.`
      }
      empty={
        <p className="mt-16 text-center text-neutral-500">
          {emptyText(profile.friendship, profile.firstName)}
        </p>
      }
    />
  );
}

// The same memories as an album, one page per year. Refreshed by friend actions too.
function ProfileAlbum({ profile }: { profile: Profile }) {
  const { album, status, retry } = useAlbum(profile.username);

  if (status === "loading") {
    return (
      <div className="mt-8 animate-pulse" aria-label="Loading the album">
        <div className="flex gap-2">
          <div className="h-11 w-20 rounded-full bg-neutral-200" />
          <div className="h-11 w-20 rounded-full bg-neutral-200" />
          <div className="h-11 w-20 rounded-full bg-neutral-200" />
        </div>
        <div className="mx-auto mt-10 h-96 max-w-260 rounded-xl bg-neutral-200" />
      </div>
    );
  }

  if (status !== "ready" || !album) {
    return (
      <div className="mt-16 flex flex-col items-center text-center">
        <p className="text-neutral-500">Couldn't load the album.</p>
        <button
          type="button"
          onClick={retry}
          className="mt-4 h-11 rounded-full border border-neutral-900 px-6 text-sm font-medium transition hover:bg-neutral-100"
        >
          Try again
        </button>
      </div>
    );
  }

  if (album.years.length === 0) {
    return (
      <p className="mt-16 text-center text-neutral-500">
        {emptyText(profile.friendship, profile.firstName)}
      </p>
    );
  }

  return <AlbumView album={album} canEdit={profile.friendship === "self"} />;
}

// Memories (the list) or Album (the book)
function ProfileTabs({ username }: { username: string }) {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex h-11 items-center border-b-2 px-1 text-sm font-medium transition ${
      isActive
        ? "border-ink text-ink"
        : "border-transparent text-neutral-500 hover:text-ink"
    }`;
  return (
    <nav aria-label="Profile" className="flex gap-6 border-b border-line">
      <NavLink to={`/u/${username}`} end className={tab}>
        Memories
      </NavLink>
      <NavLink to={`/u/${username}/album`} className={tab}>
        Album
      </NavLink>
    </nav>
  );
}

export function ProfilePage({
  view = "memories",
}: {
  view?: "memories" | "album";
}) {
  const { username = "" } = useParams();
  const { profile, status, retry } = useProfile(username);

  if (status === "loading" || (status === "ready" && !profile)) {
    return (
      <main className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <div className="flex animate-pulse items-center gap-5 border-b border-ink pb-6">
          <div className="h-20 w-20 rounded-full bg-neutral-200 sm:h-24 sm:w-24" />
          <div className="space-y-3">
            <div className="h-8 w-48 rounded bg-neutral-200" />
            <div className="h-4 w-32 rounded bg-neutral-200" />
          </div>
        </div>
      </main>
    );
  }

  if (status !== "ready" || !profile) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 text-center sm:px-6">
        <p className="font-serif text-3xl">
          {status === "not-found"
            ? "This person isn't on Memories"
            : "Couldn't load this profile"}
        </p>
        <p className="mt-1 text-neutral-500">
          {status === "not-found"
            ? "Check the username, or find them from the Friends page."
            : "Check your connection and try again."}
        </p>
        <div className="mt-6 flex gap-2">
          {status === "error" && (
            <button
              type="button"
              onClick={retry}
              className="h-11 rounded-full border border-neutral-900 px-6 text-sm font-medium transition hover:bg-neutral-100"
            >
              Try again
            </button>
          )}
          <Link
            to="/friends"
            className="flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Find people
          </Link>
        </div>
      </main>
    );
  }

  const friendLabel = profile.friendCount === 1 ? "friend" : "friends";

  return (
    <main
      className={`mx-auto px-4 pb-24 pt-10 sm:px-6 ${
        view === "album" ? "max-w-6xl" : "max-w-3xl"
      }`}
    >
      <section className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-center">
        {/* Photo and name side by side; on phones the buttons get their own row below */}
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
          <Avatar user={profile} size="lg" />
          <div className="min-w-0">
            <h1 className="font-serif text-3xl leading-tight tracking-tight break-words sm:text-5xl">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 sm:text-base">
              @{profile.username}
              <span className="hidden sm:inline">
                {" "}
                · keeping memories since {monthYear(profile.joinedAt)}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-neutral-500 sm:hidden">
              Keeping memories since {monthYear(profile.joinedAt)}
            </p>
            <p className="mt-1 text-sm">
              <span className="font-semibold tabular-nums">
                {profile.friendCount}
              </span>{" "}
              {profile.friendship === "self" ? (
                <Link to="/friends" className="underline underline-offset-4">
                  {friendLabel}
                </Link>
              ) : (
                friendLabel
              )}
            </p>
          </div>
        </div>

        {profile.friendship === "self" ? (
          <Link
            to="/settings"
            className="flex h-10 w-fit items-center gap-2 rounded-full border border-neutral-900 px-4 text-sm font-medium transition hover:bg-neutral-100"
          >
            <Settings size={16} aria-hidden="true" />
            Edit profile
          </Link>
        ) : (
          <div className="flex flex-wrap items-start gap-2 sm:justify-end">
            <FriendshipActions
              // The profile reloads after a friend action; a new status starts the buttons fresh
              key={`${profile.id}-${profile.friendship}`}
              person={profile}
              status={profile.friendship}
            />
            {/* Only when their "Who can message me?" setting allows it */}
            {profile.canMessage && <MessageButton userId={profile.id} />}
          </div>
        )}
      </section>

      <ProfileTabs username={profile.username} />

      {view === "album" ? (
        <ProfileAlbum key={profile.id} profile={profile} />
      ) : (
        <ProfileMemories key={profile.id} profile={profile} />
      )}
    </main>
  );
}
