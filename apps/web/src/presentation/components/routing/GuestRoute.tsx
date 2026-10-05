import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../../application/auth/useAuth";
import { FullPageLoader } from "../ui/FullPageLoader";

// Pages inside this route are only for logged-out visitors (login, register)
export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}
