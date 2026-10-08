import { Outlet } from "react-router";
import { AppHeader } from "./AppHeader";

// The frame around every logged-in page
export function AppLayout() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader />
      <Outlet />
    </div>
  );
}
