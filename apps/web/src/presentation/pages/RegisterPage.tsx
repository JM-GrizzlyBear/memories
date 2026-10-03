import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { register } from "../../infrastructure/api/authApi";
import { ApiError } from "../../infrastructure/api/http";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";

const initialForm = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  birthday: "",
  password: "",
  confirmPassword: "",
};

type RegisterForm = typeof initialForm;
type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

export function RegisterPage() {
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

    const labels: Record<keyof RegisterForm, string> = {
      firstName: "First name",
      lastName: "Last name",
      username: "Username",
      email: "Email",
      birthday: "Birthday",
      password: "Password",
      confirmPassword: "Confirm password",
    };

    // Email must look like name@domain.com
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid email";
    }

    // Every field is required
    for (const field of Object.keys(form) as (keyof RegisterForm)[]) {
      if (!form[field].trim()) {
        errors[field] = `${labels[field]} is required`;
      }
    }

    // Only compare passwords if both were typed
    if (
      form.password &&
      form.confirmPassword &&
      form.password !== form.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match";
    }

    // If anything is wrong, show it all and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword: _, ...input } = form;
      await register(input);
      navigate("/login");
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
      title="Register"
      subtitle="Create your account. It only takes a minute."
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
            id="firstName"
            name="firstName"
            label="First name"
            autoComplete="given-name"
            value={form.firstName}
            onChange={handleChange}
            error={fieldErrors.firstName}
          />
          <Input
            id="lastName"
            name="lastName"
            label="Last name"
            autoComplete="family-name"
            value={form.lastName}
            onChange={handleChange}
            error={fieldErrors.lastName}
          />
        </div>

        <Input
          id="username"
          name="username"
          label="Username"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          error={fieldErrors.username}
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />

        <Input
          id="birthday"
          name="birthday"
          type="date"
          label="Birthday"
          autoComplete="bday"
          value={form.birthday}
          onChange={handleChange}
          error={fieldErrors.birthday}
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

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" isLoading={isSubmitting}>
          Create account
        </Button>

        <p className="text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-neutral-900 underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
