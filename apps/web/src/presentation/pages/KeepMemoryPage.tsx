import { createMemorySchema, MEMORY_LIMITS } from "@memories/shared";
import { Check } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import type { Visibility } from "../../domain/memory";
import { ApiError } from "../../infrastructure/api/http";
import { createMemory } from "../../infrastructure/api/memoryApi";
import {
  PhotoPicker,
  type PickedPhoto,
} from "../components/memory/PhotoPicker";
import { VisibilityPicker } from "../components/memory/VisibilityPicker";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { TextArea } from "../components/ui/TextArea";

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

export function KeepMemoryPage() {
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("friends");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [keptTitle, setKeptTitle] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)); // free the previews
    setForm(initialForm);
    setPhotos([]);
    setVisibility("friends");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setKeptTitle(null);

    const errors = validate(form, photos, visibility);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const memory = await createMemory({
        ...form,
        visibility,
        photos: photos.map((photo) => photo.file),
      });
      // Until the Journal exists (step 3.5): confirm here and start a fresh form
      setKeptTitle(memory.title);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
        Keep a memory
      </h1>
      <p className="mt-2 text-neutral-500">
        Photos hold the moment. The story holds why it mattered.
      </p>

      {/* role="status" makes screen readers announce it */}
      <div role="status">
        {keptTitle && (
          <p className="mt-6 flex items-center gap-2.5 rounded-md border border-neutral-900 bg-white px-4 py-3 text-sm">
            <Check size={18} aria-hidden="true" />
            <span>
              <span className="font-semibold">Memory kept.</span> &ldquo;
              {keptTitle}&rdquo; is safe in your journal.
            </span>
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-10 grid gap-12 lg:grid-cols-2"
      >
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
            value={form.title}
            onChange={handleChange}
            error={fieldErrors.title}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="memoryDate"
              name="memoryDate"
              type="date"
              label="When did it happen?"
              max={todayLocal()}
              value={form.memoryDate}
              onChange={handleChange}
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
            rows={7}
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

          <div className="mt-2 w-full sm:w-60">
            <Button type="submit" isLoading={isSubmitting}>
              Keep this memory
            </Button>
          </div>
        </section>
      </form>
    </main>
  );
}
