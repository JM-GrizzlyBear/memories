import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { loginSchema } from "@memories/shared";
import { z } from "zod";
import { login } from "../../infrastructure/api/authApi";
import { ApiError } from "../../infrastructure/api/http";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../../application/auth/useAuth";
import { PasswordInput } from "../components/ui/PasswordInput";

const initialForm = {
  usernameOrEmail: "",
  password: "",
};

type LoginForm = typeof initialForm;
type FieldErrors = Partial<Record<keyof LoginForm, string>>;

// Checks the form in the browser with the same rules as the API
function validate(form: LoginForm): FieldErrors {
  const errors: FieldErrors = {};

  const result = loginSchema.safeParse(form);
  if (!result.success) {
    const fieldMessages = z.flattenError(result.error).fieldErrors;
    for (const [field, messages] of Object.entries(fieldMessages)) {
      if (messages?.[0]) {
        errors[field as keyof LoginForm] = messages[0];
      }
    }
  }

  return errors;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // One handler for every input: the input's `name` decides which field updates
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    // 1. Validate in the browser first
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(form);
      setUser(user);
      navigate("/", { replace: true });
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
        // 401 "Email or password is incorrect" lands here
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to see your memories.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {formError}
          </p>
        )}

        <Input
          id="usernameOrEmail"
          name="usernameOrEmail"
          label="Username or email"
          autoComplete="username"
          value={form.usernameOrEmail}
          onChange={handleChange}
          error={fieldErrors.usernameOrEmail}
        />

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <Button type="submit" isLoading={isSubmitting}>
          Log in
        </Button>

        <p className="text-center text-sm text-neutral-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-neutral-900 underline underline-offset-4"
          >
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
