import { changePasswordSchema } from "@memories/shared";
import { toast } from "sonner";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useChangePassword } from "../../../application/account/useAccountMutations";
import { apiErrorMessages, firstErrors } from "../../format/fieldErrors";
import { Button } from "../ui/Button";
import { PasswordInput } from "../ui/PasswordInput";
import { SettingsSection } from "./SettingsSection";

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};
type PasswordForm = typeof emptyForm;
type FieldErrors = Partial<Record<keyof PasswordForm, string>>;

const required: Record<keyof PasswordForm, string> = {
  currentPassword: "Current password is required",
  newPassword: "New password is required",
  confirmPassword: "Confirm your new password",
};

// Same rules as the API: length, both new fields match, different from the current one
function validate(form: PasswordForm): FieldErrors {
  const result = changePasswordSchema.safeParse(form);
  const errors: FieldErrors = result.success
    ? {}
    : firstErrors<keyof PasswordForm>(result.error);
  for (const field of Object.keys(form) as (keyof PasswordForm)[]) {
    if (!form[field]) errors[field] = required[field];
  }
  return errors;
}

export function PasswordSection({ username }: { username: string }) {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const passwordChange = useChangePassword();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await passwordChange.mutateAsync(form);
      setForm(emptyForm);
      toast.success("Password changed", {
        description:
          "You're still logged in here, and logged out on your other devices.",
      });
    } catch (caught) {
      // Problems with a field show under it; anything else gets an error toast
      setFieldErrors(apiErrorMessages<keyof PasswordForm>(caught).fields);
    }
  }

  return (
    <SettingsSection
      id="password"
      title="Password"
      description="After you change it, you'll stay logged in here and be logged out everywhere else."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Lets password managers know whose password this is */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          readOnly
          hidden
        />

        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={handleChange}
          error={fieldErrors.currentPassword}
        />
        <PasswordInput
          id="newPassword"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={handleChange}
          error={fieldErrors.newPassword}
        />
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
        />
        <p className="-mt-2 text-sm text-neutral-500">At least 8 characters.</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            isLoading={passwordChange.isPending}
            className="sm:w-auto sm:px-6"
          >
            Change password
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
