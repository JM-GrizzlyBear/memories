import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import type { Memory } from "../../../domain/memory";
import { ApiError } from "../../../infrastructure/api/http";
import { deleteMemory } from "../../../infrastructure/api/memoryApi";

interface DeleteMemoryDialogProps {
  memory: Memory | null; // a memory = open
  onClose: () => void;
  onDeleted: (memory: Memory) => void;
}

export function DeleteMemoryDialog({
  memory,
  onClose,
  onDeleted,
}: DeleteMemoryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (memory && !dialog.open) dialog.showModal();
    if (!memory && dialog.open) dialog.close();
  }, [memory]);

  function requestClose() {
    if (isDeleting) return;
    setError(null);
    onClose();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    requestClose();
  }

  async function handleDelete() {
    if (!memory) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteMemory(memory.id);
      onDeleted(memory);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      aria-labelledby="delete-memory-title"
      aria-describedby="delete-memory-description"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-paper p-0 text-ink shadow-2xl backdrop:bg-black/50 motion-safe:animate-fade-in"
    >
      {memory && (
        <div className="p-6 sm:p-8">
          <h2
            id="delete-memory-title"
            className="font-serif text-2xl tracking-tight"
          >
            Delete &ldquo;{memory.title}&rdquo;?
          </h2>
          <p
            id="delete-memory-description"
            className="mt-2 text-sm text-neutral-600"
          >
            Its photos and story will be gone for good. This can't be undone.
          </p>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              autoFocus // the safe choice is the default
              onClick={requestClose}
              disabled={isDeleting}
              className="h-11 rounded-full border border-neutral-900 px-5 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-11 rounded-full bg-red-700 px-5 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete memory"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
