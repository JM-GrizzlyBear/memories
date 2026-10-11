import { Link } from "react-router";
import { useAuth } from "../../application/auth/useAuth";
import { PasswordSection } from "../components/settings/PasswordSection";
import { ProfileDetailsSection } from "../components/settings/ProfileDetailsSection";
import { ProfilePhotoSection } from "../components/settings/ProfilePhotoSection";

export function SettingsPage() {
  const { user } = useAuth();
  if (!user) return null; // ProtectedRoute already sends logged-out visitors to /login

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <div className="border-b border-ink pb-4">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Settings
        </h1>
        <p className="mt-1 text-neutral-500">
          Your photo, your details, and your password.{" "}
          <Link
            to={`/u/${user.username}`}
            className="text-ink underline underline-offset-4"
          >
            See your profile
          </Link>
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <ProfilePhotoSection />
        <ProfileDetailsSection user={user} />
        <PasswordSection username={user.username} />
      </div>
    </main>
  );
}
