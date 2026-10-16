import { MESSAGE_LIMITS } from "@memories/shared";
import { ImagePlus, Pencil, SendHorizontal, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { Message } from "../../../domain/conversation";

interface PickedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface ComposerProps {
  editing: Message | null; // a message being edited (text only)
  onSend: (body: string, photos: File[]) => Promise<boolean>; // false = keep what was typed
  onSaveEdit: (message: Message, body: string) => Promise<boolean>;
  onCancelEdit: () => void;
  onTyping: () => void;
  autoFocus?: boolean; // start typing right away (chat windows)
}

const ACCEPT = MESSAGE_LIMITS.photoTypes.join(",");
const ALLOWED = MESSAGE_LIMITS.photoTypes as readonly string[];
const MAX_MB = MESSAGE_LIMITS.maxPhotoBytes / (1024 * 1024);
const MAX_HEIGHT_PX = 160;

// Desktop: Enter sends, Shift+Enter is a new line. Phones: the Send button sends.
function enterSends() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

// Where you write: text, up to 10 photos (each with an X), or an edit in progress
export function Composer({
  editing,
  onSend,
  onSaveEdit,
  onCancelEdit,
  onTyping,
  autoFocus = false,
}: ComposerProps) {
  const [text, setText] = useState(editing?.body ?? "");
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  // Free the previews when leaving the chat
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  });
  useEffect(() => {
    return () =>
      photosRef.current.forEach((photo) =>
        URL.revokeObjectURL(photo.previewUrl),
      );
  }, []);

  // Grow with the text, up to a few lines
  useEffect(() => {
    const field = textRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text]);

  useEffect(() => {
    if (editing || autoFocus) textRef.current?.focus();
  }, [editing, autoFocus]);

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // picking the same photo again still works
    const room = MESSAGE_LIMITS.maxPhotos - photos.length;
    const added: PickedPhoto[] = [];
    const problems: string[] = [];

    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        problems.push(`${file.name} isn't a JPG, PNG, or WebP`);
      } else if (file.size > MESSAGE_LIMITS.maxPhotoBytes) {
        problems.push(`${file.name} is larger than ${MAX_MB} MB`);
      } else if (added.length >= room) {
        problems.push(
          `You can send up to ${MESSAGE_LIMITS.maxPhotos} photos at once`,
        );
        break;
      } else {
        added.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    }
    setPhotos([...photos, ...added]);
    setProblem(problems[0] ?? null);
  }

  function removePhoto(id: string) {
    const photo = photos.find((item) => item.id === id);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setPhotos(photos.filter((item) => item.id !== id));
    setProblem(null);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (isSending) return;
    const body = text.trim();

    if (editing) {
      if (!body && editing.photos.length === 0) {
        setProblem("A message can't be empty. Unsend it instead.");
        return;
      }
      setIsSending(true);
      const saved = await onSaveEdit(editing, body);
      setIsSending(false);
      if (saved) onCancelEdit();
      return;
    }

    if (!body && photos.length === 0) return;
    const sending = photos;
    // Clear right away, like any chat app; put it back if sending fails
    setText("");
    setPhotos([]);
    setProblem(null);
    setIsSending(true);
    const sent = await onSend(
      body,
      sending.map((photo) => photo.file),
    );
    setIsSending(false);
    if (sent) {
      sending.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    } else {
      setText(body);
      setPhotos(sending);
    }
    textRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      enterSends()
    ) {
      event.preventDefault();
      void submit();
    }
    if (event.key === "Escape" && editing) {
      event.preventDefault();
      onCancelEdit();
    }
  }

  const canSend = editing ? true : text.trim().length > 0 || photos.length > 0;

  return (
    <form
      onSubmit={submit}
      className="border-t border-line bg-paper px-3 py-3 sm:px-4"
    >
      {editing && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-neutral-600">
            <Pencil size={14} aria-hidden="true" />
            Editing your message
          </span>
          <button
            type="button"
            onClick={onCancelEdit}
            className="h-8 rounded-full px-3 font-medium hover:bg-neutral-200"
          >
            Cancel
          </button>
        </div>
      )}

      {photos.length > 0 && (
        <ul
          aria-label="Photos to send"
          className="mb-2 flex gap-2 overflow-x-auto pb-1"
        >
          {photos.map((photo, index) => (
            <li key={photo.id} className="relative shrink-0">
              <img
                src={photo.previewUrl}
                alt={`Photo ${index + 1}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper shadow ring-2 ring-paper transition hover:bg-neutral-700"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {problem && (
        <p role="alert" className="mb-2 text-sm text-red-700">
          {problem}
        </p>
      )}

      <div className="flex items-end gap-2">
        {!editing && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              multiple
              onChange={addFiles}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photos.length >= MESSAGE_LIMITS.maxPhotos}
              aria-label="Add photos"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-200 hover:text-ink disabled:opacity-40"
            >
              <ImagePlus size={20} aria-hidden="true" />
            </button>
          </>
        )}

        <label htmlFor={fieldId} className="sr-only">
          {editing ? "Edit your message" : "Write a message"}
        </label>
        <textarea
          id={fieldId}
          ref={textRef}
          rows={1}
          value={text}
          maxLength={MESSAGE_LIMITS.bodyMax}
          onChange={(event) => {
            setText(event.target.value);
            if (!editing && event.target.value) onTyping();
          }}
          onKeyDown={onKeyDown}
          placeholder={editing ? "Edit your message" : "Write a message…"}
          className="min-h-11 flex-1 resize-none rounded-3xl border border-neutral-300 bg-white px-4 py-2.5 text-[15px] leading-snug outline-none transition placeholder:text-neutral-400 focus:border-ink"
        />

        <button
          type="submit"
          disabled={!canSend || isSending}
          aria-label={editing ? "Save" : "Send"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-neutral-800 disabled:bg-neutral-300"
        >
          <SendHorizontal size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
