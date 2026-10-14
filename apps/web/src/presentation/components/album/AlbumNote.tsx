import { ALBUM_LIMITS } from "@memories/shared";
import { Pencil, Plus } from "lucide-react";
import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { useSaveAlbumNote } from "../../../application/album/useAlbum";
import type { AlbumYear } from "../../../domain/album";

interface AlbumNoteProps {
  page: AlbumYear;
  username: string;
  canEdit: boolean;
}

// The owner's line about a year, in big serif letters. The owner can write or change it here.
export function AlbumNote({ page, username, canEdit }: AlbumNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const saveNote = useSaveAlbumNote(username);
  const fieldId = useId();

  const startEditing = () => {
    setDraft(page.note ?? "");
    setIsEditing(true);
  };

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    const note = draft.trim();
    if (note === (page.note ?? "")) {
      setIsEditing(false);
      return;
    }
    try {
      await saveNote.mutateAsync({ year: page.year, note });
      setIsEditing(false);
      toast.success(
        note ? `Saved your line about ${page.year}` : "Line removed",
      );
    } catch {
      // The error toast says what went wrong; keep the text so nothing is lost
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // One line: Enter saves, Escape puts it back
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void save();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={save} className="mt-5">
        <label htmlFor={fieldId} className="sr-only">
          Your line about {page.year}
        </label>
        <textarea
          id={fieldId}
          autoFocus
          rows={3}
          value={draft}
          maxLength={ALBUM_LIMITS.noteMax}
          onChange={(event) => setDraft(event.target.value.replace(/\n/g, " "))}
          onKeyDown={onKeyDown}
          placeholder={`What was ${page.year} like?`}
          className="w-full resize-none rounded-lg border border-neutral-400 bg-white px-3 py-2 font-serif text-2xl leading-snug tracking-tight focus:border-ink focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-neutral-500">
            {draft.length}/{ALBUM_LIMITS.noteMax}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="h-10 rounded-full px-4 text-sm font-medium transition hover:bg-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveNote.isPending}
              className="h-10 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {saveNote.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  if (page.note) {
    const isLong = page.note.length > 90;
    return (
      <div className="mt-5">
        <blockquote
          className={`font-serif leading-snug tracking-tight break-words ${
            isLong ? "text-2xl" : "text-[28px] lg:text-3xl"
          }`}
        >
          “{page.note}”
        </blockquote>
        {canEdit && (
          <button
            type="button"
            onClick={startEditing}
            className="mt-2 -ml-2 flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-neutral-600 transition hover:text-ink"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit this line
          </button>
        )}
      </div>
    );
  }

  if (canEdit) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className="mt-5 flex min-h-14 w-full items-center gap-2 rounded-lg border border-dashed border-neutral-400 px-4 text-left font-serif text-xl text-neutral-600 transition hover:border-ink hover:text-ink"
      >
        <Plus size={18} aria-hidden="true" className="shrink-0" />
        Write a line about {page.year}
      </button>
    );
  }

  return (
    <p className="mt-5 font-serif text-2xl leading-snug tracking-tight text-neutral-600">
      {memoryCountLine(page.memoryCount, page.year)}
    </p>
  );
}

function memoryCountLine(count: number, year: number) {
  return count === 1
    ? `One memory from ${year}.`
    : `${count} memories from ${year}.`;
}
