import { forgotPasswordSchema, PASSWORD_RESET_MINUTES } from "@memories/shared";
import { ChevronLeft, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { z } from "zod";
import {
  usePasswordResetStatus,
  useRequestPasswordReset,
} from "../../application/auth/usePasswordReset";
import { ApiError } from "../../infrastructure/api/http";
import { ResetUnavailableNotice } from "../components/auth/ResetUnavailableNotice";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const backLink =
  "inline-flex min-h-10 items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900";

export function ForgotPasswordPage() {
  const status = usePasswordResetStatus();
  const send = useRequestPasswordReset();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const unavailable =
    status.data?.available === false ||
    (send.error instanceof ApiError && send.error.code === "unavailable");

  async function sendLink(to: string) {
    const parsed = forgotPasswordSchema.safeParse({ email: to });
    if (!parsed.success) {
      setEmailError(z.flattenError(parsed.error).fieldErrors.email?.[0]);
      return;
    }
    setEmailError(undefined);
    try {
      await send.mutateAsync(parsed.data.email);
      setResent(sentTo !== null);
      setSentTo(parsed.data.email);
    } catch {
      // Shown below from send.error
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendLink(email);
  }

  const otherError =
    send.isError && !unavailable
      ? send.error instanceof ApiError && send.error.status === 429
        ? send.error.message
        : "Something went wrong. Please try again."
      : null;

  if (sentTo) {
    return (
      <AuthLayout title="Check your email">
        <div
          aria-hidden="true"
          className="mb-6 flex size-13 items-center justify-center rounded-full border border-line bg-neutral-50"
        >
          <Mail size={24} />
        </div>
        <p className="leading-relaxed text-neutral-700">
          If an account uses{" "}
          <strong className="text-neutral-900">{sentTo}</strong>, we've sent it
          a link to choose a new password. The link works for{" "}
          <strong className="text-neutral-900">
            {PASSWORD_RESET_MINUTES} minutes
          </strong>
          , one time.
        </p>
        <p className="mt-3 text-sm text-neutral-600">
          Not there? Check your spam folder. Running it on your own computer?
          The email is in Mailpit at localhost:8025.
        </p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={send.isPending}
            onClick={() => void sendLink(sentTo)}
            className="inline-flex h-11 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium
              hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900
              disabled:cursor-not-allowed disabled:opacity-60"
          >
            {send.isPending ? "Sending..." : "Send it again"}
          </button>
          <Link
            to="/login"
            className="inline-flex h-11 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Back to log in
          </Link>
        </div>
        {resent && (
          <p role="status" className="mt-4 text-sm text-green-800">
            Sent again. Only the newest link works.
          </p>
        )}
        {otherError && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {otherError}
          </p>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the email on your account. We'll send you a link to choose a new password."
    >
      <Link to="/login" className={`${backLink} -mt-4 mb-4`}>
        <ChevronLeft size={16} aria-hidden="true" />
        Back to log in
      </Link>

      {unavailable ? (
        <ResetUnavailableNotice />
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {otherError && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {otherError}
            </p>
          )}
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
          />
          <Button type="submit" isLoading={send.isPending}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
