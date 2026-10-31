import { resetPasswordSchema } from "@memories/shared";
import { Check, Circle, Clock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";
import {
  useResetLink,
  useResetPassword,
} from "../../application/auth/usePasswordReset";
import { ApiError } from "../../infrastructure/api/http";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { FullPageLoader } from "../components/ui/FullPageLoader";
import { PasswordInput } from "../components/ui/PasswordInput";
import { passwordChecklist } from "../format/passwordRules";

type Field = "newPassword" | "confirmPassword";

// Reset links stop working after 30 minutes, after one use, or when a newer email was sent
function LinkNotWorking() {
  return (
    <AuthLayout title="This link doesn't work anymore">
      <div
        aria-hidden="true"
        className="mb-6 flex size-13 items-center justify-center rounded-full bg-amber-100 text-amber-800"
      >
        <Clock size={24} />
      </div>
      <p className="leading-relaxed text-neutral-700">
        Reset links work for 30 minutes and only once. Maybe you already used
        it, or asked for a newer one. Ask for a new link and use the newest
        email.
      </p>
      <div className="mt-8 flex flex-wrap gap-2.5">
        <Link
          to="/forgot-password"
          className="inline-flex h-11 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Send a new link
        </Link>
        <Link
          to="/login"
          className="inline-flex h-11 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-50"
        >
          Back to log in
        </Link>
      </div>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const link = useResetLink(token);
  const reset = useResetPassword();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (!token) return <LinkNotWorking />;
  if (link.isPending) return <FullPageLoader />;
  const linkExpired =
    link.isError ||
    (reset.error instanceof ApiError && reset.error.code === "invalid_link");
  if (linkExpired || !link.data) return <LinkNotWorking />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = resetPasswordSchema.safeParse({
      token,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      setErrors({
        newPassword: fields.newPassword?.[0],
        confirmPassword: fields.confirmPassword?.[0],
      });
      return;
    }
    setErrors({});

    try {
      await reset.mutateAsync(parsed.data);
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch (error) {
      if (error instanceof ApiError && error.code === "invalid_link") return; // shows LinkNotWorking
      if (error instanceof ApiError && error.status === 400) {
        setErrors({
          newPassword: error.fieldErrors.newPassword?.[0],
          confirmPassword: error.fieldErrors.confirmPassword?.[0],
        });
        return;
      }
      setFormError(
        error instanceof ApiError && error.status === 429
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  const checklist = passwordChecklist(newPassword, confirmPassword);

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle={
        <>
          For{" "}
          <strong className="text-neutral-900">@{link.data.username}</strong> ·{" "}
          {link.data.email}
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {formError}
          </p>
        )}
        {/* For password managers: which account this new password belongs to */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={link.data.username}
          readOnly
          hidden
        />
        <PasswordInput
          id="newPassword"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={errors.newPassword}
        />
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Type it again"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
        />
        <ul
          className="flex flex-col gap-1.5 text-sm"
          aria-label="Password rules"
        >
          {checklist.map((rule) => (
            <li
              key={rule.id}
              className={`flex items-center gap-2 ${rule.met ? "font-medium text-green-700" : "text-neutral-600"}`}
            >
              {rule.met ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Circle size={14} aria-hidden="true" />
              )}
              {rule.label}
              <span className="sr-only">
                {rule.met ? "(done)" : "(not yet)"}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-neutral-600">
          Saving logs you out on every other phone and computer.
        </p>
        <Button type="submit" isLoading={reset.isPending}>
          Save new password
        </Button>
      </form>
    </AuthLayout>
  );
}
