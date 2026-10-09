import { Outlet } from "react-router";
import { KeepMemoryProvider } from "../memory/KeepMemoryProvider";
import { AppHeader } from "./AppHeader";

// The frame around every logged-in page, with the Keep a memory dialog available everywhere
export function AppLayout() {
  return (
    <KeepMemoryProvider>
      <div className="min-h-screen bg-paper text-ink">
        <AppHeader />
        <Outlet />
      </div>
    </KeepMemoryProvider>
  );
}
