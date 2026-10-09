import { useEffect, useRef, type SyntheticEvent } from "react";
import type { UserSummary } from "../../../domain/friendship";

interface UnfriendDialogProps {
  person: UserSummary | null; // a person = open
  isWorking: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// "Are you sure?" before unfriending, since it changes what both people can see
export function UnfriendDialog({
  person,
  isWorking,
  onConfirm,
  onClose,
}: UnfriendDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (person && !dialog.open) dialog.showModal();
    if (!person && dialog.open) dialog.close();
  }, [person]);

  function requestClose() {
    if (!isWorking) onClose();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault(); // Escape: close through React, so state stays in sync
    requestClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      aria-labelledby="unfriend-title"
      aria-describedby="unfriend-description"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-paper p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      {person && (
        <div className="p-6 sm:p-8">
          <h2 id="unfriend-title" className="font-serif text-2xl tracking-tight">
            Unfriend {person.firstName} {person.lastName}?
          </h2>
          <p id="unfriend-description" className="mt-2 text-sm text-neutral-600">
            You'll both stop seeing each other's &ldquo;Friends&rdquo; memories.
            They won't be told, and you can add each other again later.
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              autoFocus // the safe choice is the default
              onClick={requestClose}
              disabled={isWorking}
              className="h-11 rounded-full border border-neutral-900 px-5 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isWorking}
              className="h-11 rounded-full bg-red-700 px-5 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWorking ? "Unfriending..." : "Unfriend"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
