import { createMemorySchema, MEMORY_LIMITS } from "@memories/shared";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import type { Memory, Visibility } from "../../../domain/memory";
import { ApiError } from "../../../infrastructure/api/http";
import { createMemory } from "../../../infrastructure/api/memoryApi";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { TextArea } from "../ui/TextArea";
import { PhotoPicker, type PickedPhoto } from "./PhotoPicker";
import { VisibilityPicker } from "./VisibilityPicker";
import { DateInput } from "../ui/DateInput";

const initialForm = {
  title: "",
  story: "",
  memoryDate: "",
  location: "",
};

type TextFields = typeof initialForm;
type FieldErrors = Partial<
  Record<keyof TextFields | "photos" | "visibility", string>
>;

// Today as "YYYY-MM-DD" in the user's own time zone ("en-CA" happens to use that format)
function todayLocal() {
  return new Date().toLocaleDateString("en-CA");
}

// Same rules as the API (shared schema), plus the photo count
function validate(
  form: TextFields,
  photos: PickedPhoto[],
  visibility: Visibility,
): FieldErrors {
  const errors: FieldErrors = {};

  const result = createMemorySchema.safeParse({ ...form, visibility });
  if (!result.success) {
    const fieldMessages = z.flattenError(result.error).fieldErrors;
    for (const [field, messages] of Object.entries(fieldMessages)) {
      if (messages?.[0]) {
        errors[field as keyof FieldErrors] = messages[0];
      }
    }
  }

  if (photos.length === 0) {
    errors.photos = "Add at least one photo";
  }

  return errors;
}

interface KeepMemoryFormProps {
  onKept: (memory: Memory) => void;
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSubmittingChange: (isSubmitting: boolean) => void;
}

export function KeepMemoryForm({
  onKept,
  onCancel,
  onDirtyChange,
  onSubmittingChange,
}: KeepMemoryFormProps) {
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("friends");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // "Dirty" = the person has started something we shouldn't throw away silently
  const isDirty =
    photos.length > 0 ||
    Object.values(form).some((value) => value.trim() !== "");
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function setSubmitting(value: boolean) {
    setIsSubmitting(value);
    onSubmittingChange(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const errors = validate(form, photos, visibility);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const memory = await createMemory({
        ...form,
        visibility,
        photos: photos.map((photo) => photo.file),
      });
      onKept(memory);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(error.fieldErrors).map(([field, messages]) => [
              field,
              messages[0],
            ]),
          ),
        );
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* The scrolling part */}
      <div className="grid min-h-0 flex-1 gap-10 overflow-y-auto px-5 py-6 sm:px-8 lg:grid-cols-2">
        {formError && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-2"
          >
            {formError}
          </p>
        )}

        <section aria-label="Photos">
          <PhotoPicker
            photos={photos}
            onChange={setPhotos}
            error={fieldErrors.photos}
          />
        </section>

        <section aria-label="Details" className="flex flex-col gap-5">
          <Input
            id="title"
            name="title"
            label="Title"
            placeholder="Graduation trip with the barkada"
            maxLength={MEMORY_LIMITS.titleMax}
            autoFocus
            value={form.title}
            onChange={handleChange}
            error={fieldErrors.title}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <DateInput
              id="memoryDate"
              name="memoryDate"
              label="When did it happen?"
              max={todayLocal()}
              value={form.memoryDate}
              onChange={(isoDate) =>
                setForm((current) => ({ ...current, memoryDate: isoDate }))
              }
              error={fieldErrors.memoryDate}
            />
            <Input
              id="location"
              name="location"
              label="Where? (optional)"
              placeholder="Baguio City"
              maxLength={MEMORY_LIMITS.locationMax}
              value={form.location}
              onChange={handleChange}
              error={fieldErrors.location}
            />
          </div>

          <TextArea
            id="story"
            name="story"
            label="The story"
            rows={6}
            placeholder="Who was there? What did it feel like? What do you want to remember?"
            maxLength={MEMORY_LIMITS.storyMax}
            hint={`${form.story.length} / ${MEMORY_LIMITS.storyMax}`}
            value={form.story}
            onChange={handleChange}
            error={fieldErrors.story}
          />

          <VisibilityPicker
            value={visibility}
            onChange={setVisibility}
            error={fieldErrors.visibility}
          />
        </section>
      </div>

      {/* The footer stays visible while the fields scroll */}
      <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-11 rounded-full px-5 text-sm font-medium transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <div className="w-48">
          <Button type="submit" isLoading={isSubmitting}>
            Keep this memory
          </Button>
        </div>
      </div>
    </form>
  );
}
