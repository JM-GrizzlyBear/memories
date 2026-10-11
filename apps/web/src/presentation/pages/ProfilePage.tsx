import { useCallback } from "react";
import { Link, useParams } from "react-router";
import { useJournal } from "../../application/memory/useJournal";
import { useProfile } from "../../application/user/useProfile";
import type { FriendshipStatus, Profile } from "../../domain/friendship";
import type { Memory } from "../../domain/memory";
import { FriendshipActions } from "../components/friendship/FriendshipActions";
import { MemoryList } from "../components/memory/MemoryList";
import { Notice } from "../components/memory/Notice";
import { useSyncWithMemoryDialogs } from "../components/memory/useSyncWithMemoryDialogs";
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

// The memories part. Its key changes with the person and the friendship, so it reloads then.
function ProfileMemories({ profile }: { profile: Profile }) {
  const journal = useJournal(profile.id);
  const belongsHere = useCallback(
    (memory: Memory) => memory.userId === profile.id,
    [profile.id],
  );
  const notice = useSyncWithMemoryDialogs(journal, belongsHere);

  return (
    <>
      <Notice text={notice} />
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
    </>
  );
}

export function ProfilePage() {
  const { username = "" } = useParams();
  const { profile, status, setProfile, retry } = useProfile(username);

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

  // Becoming (or no longer being) friends changes the count and which memories show
  function handleFriendshipChange(friendship: FriendshipStatus) {
    setProfile((current) => {
      if (!current) return current;
      const wasFriends = current.friendship === "friends";
      const isFriends = friendship === "friends";
      const change = isFriends && !wasFriends ? 1 : !isFriends && wasFriends ? -1 : 0;
      return {
        ...current,
        friendship,
        friendCount: current.friendCount + change,
      };
    });
  }

  const friendLabel = profile.friendCount === 1 ? "friend" : "friends";

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <section className="flex flex-wrap items-center gap-5 border-b border-ink pb-6">
        <Avatar user={profile} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="mt-1 text-neutral-500">
            @{profile.username} · keeping memories since{" "}
            {monthYear(profile.joinedAt)}
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
        <FriendshipActions
          key={`${profile.id}-${profile.friendship}`}
          person={profile}
          status={profile.friendship}
          onChange={handleFriendshipChange}
        />
      </section>

      <ProfileMemories
        // Different person, or friendship changed: load the memories again
        key={`${profile.id}-${profile.friendship === "friends"}`}
        profile={profile}
      />
    </main>
  );
}
