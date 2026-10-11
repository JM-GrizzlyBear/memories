import { PROFILE_PHOTO_LIMITS } from "@memories/shared";
import { Camera, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  useRemoveProfilePhoto,
  useUploadProfilePhoto,
} from "../../../application/account/useAccountMutations";
import { useAuth } from "../../../application/auth/useAuth";
import { apiErrorMessages } from "../../format/fieldErrors";
import { Avatar } from "../user/Avatar";
import { FormError, FormSuccess } from "./FormMessages";
import { SettingsSection } from "./SettingsSection";

const primary =
  "flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-60";
const secondary =
  "flex h-11 items-center gap-2 rounded-full border border-neutral-900 px-5 text-sm font-medium transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-60";

interface PickedPhoto {
  file: File;
  previewUrl: string; // a temporary link to the file, for the preview
}

const maxMb = PROFILE_PHOTO_LIMITS.maxBytes / (1024 * 1024);

export function ProfilePhotoSection() {
  const { user } = useAuth();
  const upload = useUploadProfilePhoto();
  const removal = useRemoveProfilePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PickedPhoto | null>(null);
  const busy = upload.isPending
    ? "saving"
    : removal.isPending
      ? "removing"
      : null;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Free the preview's memory when it's replaced or the page closes
  useEffect(() => {
    return () => {
      if (picked) URL.revokeObjectURL(picked.previewUrl);
    };
  }, [picked]);

  if (!user) return null;

  function handlePick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // so picking the same file again still works
    setError(null);
    setSuccess(null);
    if (!file) return;

    // Same rules as the API: quick feedback without uploading anything
    if (
      !(PROFILE_PHOTO_LIMITS.types as readonly string[]).includes(file.type)
    ) {
      setError("Choose a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > PROFILE_PHOTO_LIMITS.maxBytes) {
      setError(`The photo must be ${maxMb} MB or smaller.`);
      return;
    }
    setPicked({ file, previewUrl: URL.createObjectURL(file) });
  }

  async function handleSave() {
    if (!picked) return;
    setError(null);
    try {
      await upload.mutateAsync(picked.file); // the header shows it right away
      setPicked(null);
      setSuccess("Profile photo saved.");
    } catch (caught) {
      const { fields, form } = apiErrorMessages<"photo">(caught);
      setError(fields.photo ?? form);
    }
  }

  async function handleRemove() {
    setError(null);
    setSuccess(null);
    try {
      await removal.mutateAsync();
      setSuccess("Profile photo removed.");
    } catch (caught) {
      setError(apiErrorMessages(caught).form);
    }
  }

  return (
    <SettingsSection
      id="photo"
      title="Profile photo"
      description={`Shown next to your name everywhere. JPG, PNG, or WebP, up to ${maxMb} MB.`}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {picked ? (
          <img
            src={picked.previewUrl}
            alt="Preview of your new profile photo"
            className="h-28 w-28 shrink-0 rounded-full object-cover ring-2 ring-neutral-900 ring-offset-2"
          />
        ) : (
          <Avatar user={user} size="xl" />
        )}

        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            id="profile-photo-file"
            type="file"
            accept={PROFILE_PHOTO_LIMITS.types.join(",")}
            onChange={handlePick}
            className="sr-only"
            tabIndex={-1}
          />

          {picked ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={busy !== null}
                className={primary}
              >
                {busy === "saving" ? "Saving..." : "Save photo"}
              </button>
              <button
                type="button"
                onClick={() => setPicked(null)}
                disabled={busy !== null}
                className="h-11 rounded-full px-4 text-sm font-medium underline-offset-4 hover:underline disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy !== null}
                className={primary}
              >
                <Camera size={16} aria-hidden="true" />
                {user.profilePhotoUrl ? "Change photo" : "Upload photo"}
              </button>
              {user.profilePhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={busy !== null}
                  className={secondary}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {busy === "removing" ? "Removing..." : "Remove"}
                </button>
              )}
            </div>
          )}

          {picked && (
            <p className="text-sm text-neutral-500">
              This is a preview. Save to use it.
            </p>
          )}
          <FormError text={error} />
          <FormSuccess text={success} />
        </div>
      </div>
    </SettingsSection>
  );
}
