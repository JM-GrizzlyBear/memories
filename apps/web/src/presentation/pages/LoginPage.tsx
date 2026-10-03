import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { login, register } from "../../infrastructure/api/authApi";
import { ApiError } from "../../infrastructure/api/http";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";

const initialForm = {
  usernameOrEmail: "",
  password: "",
};

type LoginForm = typeof initialForm;
type FieldErrors = Partial<Record<keyof LoginForm, string>>;

export function LoginPage() {
  const navigate = useNavigate();
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

    // 2. Check the form in the browser first, collecting ALL errors at once
    const errors: FieldErrors = {};

    const labels: Record<keyof LoginForm, string> = {
      usernameOrEmail: "Username or Email",
      password: "Password",
    };

    // Every field is required
    for (const field of Object.keys(form) as (keyof LoginForm)[]) {
      if (!form[field].trim()) {
        errors[field] = `${labels[field]} is required`;
      }
    }

    // If anything is wrong, show it all and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await login(form);
      navigate("/");
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
    <AuthLayout
      title="Log in"
      subtitle="Welcome back! Please enter your details."
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="usernameOrEmail"
            name="usernameOrEmail"
            label="Username or Email"
            autoComplete="username"
            value={form.usernameOrEmail}
            onChange={handleChange}
            error={fieldErrors.usernameOrEmail}
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />
        </div>

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
