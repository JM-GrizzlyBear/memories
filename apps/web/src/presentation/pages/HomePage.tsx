import { useState } from "react";
import { useAuth } from "../../application/auth/useAuth";
import { Button } from "../components/ui/Button";

export function HomePage() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      // No navigate needed: user becomes null, so ProtectedRoute sends us to /login
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Hi, {user?.firstName}! 👋
        </h1>
        <p className="mt-1 text-sm text-neutral-500">@{user?.username}</p>
        <Button
          onClick={handleLogout}
          isLoading={isLoggingOut}
          className="mt-6"
        >
          Log out
        </Button>
      </div>
    </main>
  );
}
