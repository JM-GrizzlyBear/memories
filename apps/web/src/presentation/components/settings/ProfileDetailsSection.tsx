import { updateProfileSchema } from "@memories/shared";
import { toast } from "sonner";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useUpdateProfile } from "../../../application/account/useAccountMutations";
import type { User } from "../../../domain/user";
import { apiErrorMessages, firstErrors } from "../../format/fieldErrors";
import { Button } from "../ui/Button";
import { DateInput } from "../ui/DateInput";
import { Input } from "../ui/Input";
import { FormError } from "./FormMessages";
import { SettingsSection } from "./SettingsSection";

interface ProfileForm {
  firstName: string;
  lastName: string;
  username: string;
  birthday: string; // "1998-01-10"
}
type FieldErrors = Partial<Record<keyof ProfileForm, string>>;

const labels: Record<keyof ProfileForm, string> = {
  firstName: "First name",
  lastName: "Last name",
  username: "Username",
  birthday: "Birthday",
};

function formFromUser(user: User): ProfileForm {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    birthday: user.birthday.slice(0, 10), // "1998-01-10T00:00:00.000Z" → "1998-01-10"
  };
}

// Same rules as the API, plus a clear "is required" for empty fields
function validate(form: ProfileForm): FieldErrors {
  const result = updateProfileSchema.safeParse(form);
  const errors: FieldErrors = result.success
    ? {}
    : firstErrors<keyof ProfileForm>(result.error);
  for (const field of Object.keys(form) as (keyof ProfileForm)[]) {
    if (!form[field].trim()) errors[field] = `${labels[field]} is required`;
  }
  return errors;
}

export function ProfileDetailsSection({ user }: { user: User }) {
  const saveProfile = useUpdateProfile();
  const [form, setForm] = useState(() => formFromUser(user));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const saved = formFromUser(user);
  const isChanged = (Object.keys(form) as (keyof ProfileForm)[]).some(
    (field) => form[field].trim() !== saved[field],
  );
  const newUsername = form.username.trim().toLowerCase();
  const usernameChanges = newUsername !== "" && newUsername !== user.username;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      // The header and menu show the new name right away
      const updated = await saveProfile.mutateAsync(form);
      setForm(formFromUser(updated));
      toast.success("Profile saved");
    } catch (caught) {
      const { fields, form: message } =
        apiErrorMessages<keyof ProfileForm>(caught);
      setFieldErrors(fields);
      setFormError(message);
    }
  }

  return (
    <SettingsSection
      id="profile"
      title="Profile"
      description="Your name and username are shown to everyone on Memories. Your birthday stays private."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError text={formError} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="settings-firstName"
            name="firstName"
            label="First name"
            autoComplete="given-name"
            value={form.firstName}
            onChange={handleChange}
            error={fieldErrors.firstName}
          />
          <Input
            id="settings-lastName"
            name="lastName"
            label="Last name"
            autoComplete="family-name"
            value={form.lastName}
            onChange={handleChange}
            error={fieldErrors.lastName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="settings-username"
            name="username"
            label="Username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={form.username}
            onChange={handleChange}
            error={fieldErrors.username}
          />
          {usernameChanges && !fieldErrors.username ? (
            <p className="text-sm text-amber-800">
              Your profile link will change to /u/{newUsername}. Old links to
              /u/{user.username} will stop working.
            </p>
          ) : (
            <p className="text-sm text-neutral-500">
              Your profile link: /u/{user.username}
            </p>
          )}
        </div>

        <DateInput
          id="settings-birthday"
          name="birthday"
          label="Birthday"
          max={new Date().toLocaleDateString("en-CA")}
          value={form.birthday}
          onChange={(isoDate) => {
            setForm((current) => ({ ...current, birthday: isoDate }));
          }}
          error={fieldErrors.birthday}
        />

        <p className="text-sm text-neutral-500">
          Email: <span className="text-ink">{user.email}</span> (can't be
          changed yet)
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            isLoading={saveProfile.isPending}
            disabled={!isChanged}
            className="sm:w-auto sm:px-6"
          >
            Save changes
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
