import { useEffect, useRef, type SyntheticEvent } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  workingLabel: string;
  isWorking: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// "Are you sure?" for things that can't be undone (unsend, leave, remove)
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  workingLabel,
  isWorking,
  danger = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

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
      aria-label={title}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-paper p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      {open && (
        <div className="p-6 sm:p-8">
          <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-neutral-600">{description}</p>
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
              className={`h-11 rounded-full px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                danger
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-neutral-900 hover:bg-neutral-800"
              }`}
            >
              {isWorking ? workingLabel : confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
