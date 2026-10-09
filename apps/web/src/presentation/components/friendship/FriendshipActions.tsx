import { Check, UserPlus } from "lucide-react";
import { useState } from "react";
import { useFriendship } from "../../../application/friendship/useFriendship";
import type {
  FriendshipStatus,
  UserSummary,
} from "../../../domain/friendship";
import { UnfriendDialog } from "./UnfriendDialog";

const primary =
  "flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60";
const secondary =
  "flex h-10 items-center gap-2 rounded-full border border-neutral-900 px-4 text-sm font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60";

interface FriendshipActionsProps {
  person: UserSummary;
  status: FriendshipStatus;
  onChange?: (status: FriendshipStatus) => void;
}

// The right buttons for how I relate to this person:
// Add friend → Cancel request; Accept / Decline; Friends → Unfriend
export function FriendshipActions({
  person,
  status: initial,
  onChange,
}: FriendshipActionsProps) {
  const friendship = useFriendship(person.id, initial, onChange);
  const [confirmingUnfriend, setConfirmingUnfriend] = useState(false);
  const name = `${person.firstName} ${person.lastName}`;
  const { status, isWorking } = friendship;

  if (status === "self") return null;

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {status === "none" && (
          <button
            type="button"
            onClick={friendship.add}
            disabled={isWorking}
            className={primary}
          >
            <UserPlus size={16} aria-hidden="true" />
            {isWorking ? "Sending..." : "Add friend"}
          </button>
        )}

        {status === "request_sent" && (
          <>
            <span className="text-sm text-neutral-500">Request sent</span>
            <button
              type="button"
              onClick={friendship.cancel}
              disabled={isWorking}
              aria-label={`Cancel friend request to ${name}`}
              className={secondary}
            >
              {isWorking ? "Cancelling..." : "Cancel request"}
            </button>
          </>
        )}

        {status === "request_received" && (
          <>
            <button
              type="button"
              onClick={friendship.accept}
              disabled={isWorking}
              aria-label={`Accept friend request from ${name}`}
              className={primary}
            >
              <Check size={16} aria-hidden="true" />
              Accept
            </button>
            <button
              type="button"
              onClick={friendship.decline}
              disabled={isWorking}
              aria-label={`Decline friend request from ${name}`}
              className={secondary}
            >
              Decline
            </button>
          </>
        )}

        {status === "friends" && (
          <>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Check size={16} aria-hidden="true" />
              Friends
            </span>
            <button
              type="button"
              onClick={() => setConfirmingUnfriend(true)}
              disabled={isWorking}
              aria-label={`Unfriend ${name}`}
              className={secondary}
            >
              Unfriend
            </button>
          </>
        )}
      </div>

      {friendship.error && (
        <p role="alert" className="max-w-xs text-sm text-red-600">
          {friendship.error}
        </p>
      )}

      <UnfriendDialog
        person={confirmingUnfriend ? person : null}
        isWorking={isWorking}
        onClose={() => setConfirmingUnfriend(false)}
        onConfirm={async () => {
          await friendship.unfriend();
          setConfirmingUnfriend(false);
        }}
      />
    </div>
  );
}
