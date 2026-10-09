import { Search, Users } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useFriends } from "../../application/friendship/useFriends";
import { useUserSearch } from "../../application/user/useUserSearch";
import { FriendshipActions } from "../components/friendship/FriendshipActions";
import { PersonRow } from "../components/user/PersonRow";
import { monthYear } from "../format/dates";

const TABS = [
  { id: "friends", label: "Friends" },
  { id: "requests", label: "Requests" },
  { id: "sent", label: "Sent" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function EmptyNote({ children }: { children: string }) {
  return <p className="py-10 text-center text-neutral-500">{children}</p>;
}

export function FriendsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab: TabId = isTabId(requestedTab) ? requestedTab : "friends";

  const [searchText, setSearchText] = useState("");
  const search = useUserSearch(searchText);
  const lists = useFriends();

  const counts: Record<TabId, number> = {
    friends: lists.friends.length,
    requests: lists.incoming.length,
    sent: lists.outgoing.length,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <div className="border-b border-ink pb-4">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Friends
        </h1>
        <p className="mt-1 text-neutral-500">
          Friends can see the memories you keep for &ldquo;Friends&rdquo;.
        </p>
      </div>

      {/* Find people */}
      <section aria-labelledby="find-people" className="mt-8">
        <h2
          id="find-people"
          className="text-xs font-semibold uppercase tracking-[0.15em]"
        >
          Find people
        </h2>
        <div className="relative mt-3">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <label htmlFor="people-search" className="sr-only">
            Search by name or username
          </label>
          <input
            id="people-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name or username"
            autoComplete="off"
            className="h-12 w-full rounded-md border border-neutral-300 bg-white pl-11 pr-3 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div aria-live="polite">
          {search.status === "searching" && (
            <p className="mt-3 text-sm text-neutral-500">Searching...</p>
          )}
          {search.status === "error" && (
            <p className="mt-3 text-sm text-red-600">
              Couldn't search right now. Try again.
            </p>
          )}
          {search.status === "ready" && search.results.length === 0 && (
            <p className="mt-3 text-sm text-neutral-500">
              No one found for &ldquo;{searchText.trim()}&rdquo;.
            </p>
          )}
        </div>

        {search.results.length > 0 && (
          <ul className="mt-2 divide-y divide-line">
            {search.results.map((person) => (
              <PersonRow key={person.id} person={person}>
                <FriendshipActions
                  // A new status from the server starts the buttons fresh
                  key={person.friendship}
                  person={person}
                  status={person.friendship}
                  onChange={lists.refresh}
                />
              </PersonRow>
            ))}
          </ul>
        )}
      </section>

      {/* My lists */}
      <section aria-label="Your friends and requests" className="mt-12">
        <div
          role="group"
          aria-label="Show"
          className="flex flex-wrap gap-2 border-b border-line pb-4"
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() =>
                setSearchParams(id === "friends" ? {} : { tab: id }, {
                  replace: true,
                })
              }
              className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm transition ${
                tab === id
                  ? "bg-neutral-900 font-medium text-white"
                  : "border border-line bg-white text-neutral-700 hover:border-neutral-900"
              }`}
            >
              {label}
              {lists.status === "ready" && (
                <span
                  className={`tabular-nums ${tab === id ? "text-neutral-300" : "text-neutral-500"}`}
                >
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {lists.status === "loading" && (
          <p className="py-10 text-center text-neutral-500">Loading...</p>
        )}

        {lists.status === "error" && (
          <div className="py-10 text-center">
            <p className="text-neutral-600">Couldn't load your friends.</p>
            <button
              type="button"
              onClick={lists.retry}
              className="mt-4 h-11 rounded-full border border-neutral-900 px-6 text-sm font-medium transition hover:bg-neutral-900 hover:text-white"
            >
              Try again
            </button>
          </div>
        )}

        {lists.status === "ready" && tab === "friends" && (
          <>
            {lists.friends.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Users size={32} strokeWidth={1.5} aria-hidden="true" />
                <p className="mt-3 font-serif text-2xl">No friends yet</p>
                <p className="mt-1 max-w-sm text-neutral-500">
                  Search for someone above and send them a friend request.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {lists.friends.map((friend) => (
                  <PersonRow
                    key={friend.id}
                    person={friend}
                    detail={`friends since ${monthYear(friend.friendsSince)}`}
                  >
                    <FriendshipActions
                      person={friend}
                      status="friends"
                      onChange={lists.refresh}
                    />
                  </PersonRow>
                ))}
              </ul>
            )}
          </>
        )}

        {lists.status === "ready" && tab === "requests" && (
          <>
            {lists.incoming.length === 0 ? (
              <EmptyNote>No one is waiting for an answer.</EmptyNote>
            ) : (
              <ul className="divide-y divide-line">
                {lists.incoming.map((request) => (
                  <PersonRow key={request.id} person={request}>
                    <FriendshipActions
                      person={request}
                      status="request_received"
                      onChange={lists.refresh}
                    />
                  </PersonRow>
                ))}
              </ul>
            )}
          </>
        )}

        {lists.status === "ready" && tab === "sent" && (
          <>
            {lists.outgoing.length === 0 ? (
              <EmptyNote>You haven't sent any requests.</EmptyNote>
            ) : (
              <ul className="divide-y divide-line">
                {lists.outgoing.map((request) => (
                  <PersonRow key={request.id} person={request}>
                    <FriendshipActions
                      person={request}
                      status="request_sent"
                      onChange={lists.refresh}
                    />
                  </PersonRow>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}
