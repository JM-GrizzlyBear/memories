import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../../application/auth/useAuth";
import { FullPageLoader } from "../ui/FullPageLoader";

// Pages inside this route are only for logged-in users
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />; // show the page that matched
}
