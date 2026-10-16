import { Outlet } from "react-router";
import { useAuth } from "../../../application/auth/useAuth";
import { LandingPage } from "../../pages/LandingPage";
import { FullPageLoader } from "../ui/FullPageLoader";

// "/" is two pages, like Facebook: the landing page for visitors,
// and your journal once you're logged in
export function HomeRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (!user) return <LandingPage />;

  return <Outlet />;
}
