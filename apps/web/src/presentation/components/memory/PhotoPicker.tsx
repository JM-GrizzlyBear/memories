import { MEMORY_LIMITS } from "@memories/shared";
import { ImagePlus, Star, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

// A photo already saved on the memory, or a new file picked from the device
export type PickedPhoto =
  | { kind: "existing"; id: string; previewUrl: string }
  | { kind: "new"; id: string; file: File; previewUrl: string };

interface PhotoPickerProps {
  photos: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
  error?: string;
}

const ACCEPT = MEMORY_LIMITS.photoTypes.join(",");
const MAX_MB = MEMORY_LIMITS.maxPhotoBytes / (1024 * 1024);
const ALLOWED_TYPES = MEMORY_LIMITS.photoTypes as readonly string[];

// Only new files have a temporary preview URL that must be freed
function release(photo: PickedPhoto) {
  if (photo.kind === "new") URL.revokeObjectURL(photo.previewUrl);
}

export function PhotoPicker({ photos, onChange, error }: PhotoPickerProps) {
  const [pickError, setPickError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Free every preview URL when the form closes
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  });
  useEffect(() => {
    return () => photosRef.current.forEach(release);
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    const room = MEMORY_LIMITS.maxPhotos - photos.length;
    const accepted: PickedPhoto[] = [];
    const problems: string[] = [];

    for (const file of Array.from(fileList)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        problems.push(`${file.name} isn't a JPG, PNG, or WebP`);
        continue;
      }
      if (file.size > MEMORY_LIMITS.maxPhotoBytes) {
        problems.push(`${file.name} is larger than ${MAX_MB} MB`);
        continue;
      }
      if (accepted.length >= room) {
        problems.push(`You can add up to ${MEMORY_LIMITS.maxPhotos} photos`);
        break;
      }
      accepted.push({
        kind: "new",
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setPickError(problems[0] ?? null);
    if (accepted.length > 0) {
      onChange([...photos, ...accepted]);
    }
  }

  function remove(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (photo) release(photo);
    onChange(photos.filter((p) => p.id !== id));
  }

  function makeCover(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;
    onChange([photo, ...photos.filter((p) => p.id !== id)]);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
    event.target.value = ""; // allow picking the same file again later
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  const shownError = error ?? pickError;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.15em]">
          Photos
        </span>
        <span className="text-sm text-neutral-500">
          {photos.length} of {MEMORY_LIMITS.maxPhotos}
        </span>
      </div>

      {/* The real file input is hidden; the big label is what people click or drop onto */}
      <input
        id="photos"
        type="file"
        accept={ACCEPT}
        multiple
        onChange={handleInput}
        aria-describedby={shownError ? "photos-error" : undefined}
        className="peer sr-only"
      />
      <label
        htmlFor="photos"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-3 flex h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed bg-white p-6 text-center transition
          peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-900
          ${isDragging ? "border-neutral-900 bg-neutral-100" : shownError ? "border-red-600" : "border-neutral-400 hover:border-neutral-900"}`}
      >
        <ImagePlus size={30} strokeWidth={1.5} aria-hidden="true" />
        <span className="font-serif text-2xl">Drop photos here</span>
        <span className="text-sm text-neutral-500">
          or choose from your device · JPG, PNG, or WebP up to {MAX_MB} MB
        </span>
      </label>

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className={`relative aspect-square overflow-hidden bg-neutral-200 ${index === 0 ? "ring-2 ring-neutral-900 ring-offset-2 ring-offset-paper" : ""}`}
            >
              <img
                src={photo.previewUrl}
                alt={`Photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute bottom-1.5 left-1.5 bg-neutral-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  Cover
                </span>
              )}
              <div className="absolute right-1 top-1 flex gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(photo.id)}
                    aria-label={`Make photo ${index + 1} the cover`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-900 transition hover:bg-white"
                  >
                    <Star size={15} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(photo.id)}
                  aria-label={`Remove photo ${index + 1}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-900 transition hover:bg-white"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {shownError && (
        <p id="photos-error" role="alert" className="mt-2 text-sm text-red-600">
          {shownError}
        </p>
      )}
    </div>
  );
}
