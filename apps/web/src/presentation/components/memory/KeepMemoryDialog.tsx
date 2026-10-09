import { X } from "lucide-react";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import type { Memory } from "../../../domain/memory";
import { KeepMemoryForm } from "./KeepMemoryForm";

interface KeepMemoryDialogProps {
  open: boolean;
  onClose: () => void;
  onKept: (memory: Memory) => void;
}

export function KeepMemoryDialog({
  open,
  onClose,
  onKept,
}: KeepMemoryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  // Open and close the real <dialog> when `open` changes
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function finishClose() {
    setIsConfirmingDiscard(false);
    setIsDirty(false);
    onClose();
  }

  // Every way of closing comes here: ✕, Cancel, Escape, clicking outside
  function requestClose() {
    if (isSubmitting) return; // never close in the middle of an upload
    if (isDirty) {
      setIsConfirmingDiscard(true); // ask first, don't lose their photos
      return;
    }
    finishClose();
  }

  // Escape fires "cancel". We handle it ourselves, so unsaved work is protected.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    requestClose();
  }

  function handleKept(memory: Memory) {
    setIsDirty(false);
    onKept(memory);
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={(event) => {
        // A click on the dark area outside the window lands on the <dialog> itself
        if (event.target === event.currentTarget) requestClose();
      }}
      aria-labelledby="keep-memory-title"
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-paper p-0 text-ink backdrop:bg-black/50
        motion-safe:animate-fade-in sm:m-auto sm:h-auto sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-5xl sm:rounded-lg sm:shadow-2xl"
    >
      {/* Only mounted while open, so every opening starts with a fresh, empty form */}
      {open && (
        <div className="flex h-full flex-col sm:max-h-[90vh]">
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-8 sm:py-5">
            <div>
              <h2
                id="keep-memory-title"
                className="font-serif text-3xl tracking-tight"
              >
                Keep a memory
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                Photos hold the moment. The story holds why it mattered.
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-neutral-900"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </header>

          <KeepMemoryForm
            onKept={handleKept}
            onCancel={requestClose}
            onDirtyChange={setIsDirty}
            onSubmittingChange={setIsSubmitting}
          />

          {isConfirmingDiscard && (
            <div
              role="alertdialog"
              aria-labelledby="discard-title"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-900 bg-white px-5 py-4 sm:px-8"
            >
              <p id="discard-title" className="text-sm">
                <span className="font-semibold">Discard this memory?</span> Your
                photos and story won't be saved.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setIsConfirmingDiscard(false)}
                  className="h-11 rounded-full border border-neutral-900 px-5 text-sm font-medium transition hover:bg-neutral-100"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={finishClose}
                  className="h-11 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
