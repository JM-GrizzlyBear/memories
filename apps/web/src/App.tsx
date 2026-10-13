import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./presentation/components/layout/AppLayout";
import { GuestRoute } from "./presentation/components/routing/GuestRoute";
import { ProtectedRoute } from "./presentation/components/routing/ProtectedRoute";
import { FriendsPage } from "./presentation/pages/FriendsPage";
import { JournalPage } from "./presentation/pages/JournalPage";
import { LoginPage } from "./presentation/pages/LoginPage";
import { LiveNotifications } from "./presentation/components/notification/LiveNotifications";
import { MemoryViewerPage } from "./presentation/pages/MemoryViewerPage";
import { NotificationUnavailablePage } from "./presentation/pages/NotificationUnavailablePage";
import { NotificationsPage } from "./presentation/pages/NotificationsPage";
import { ProfilePage } from "./presentation/pages/ProfilePage";
import { RegisterPage } from "./presentation/pages/RegisterPage";
import { SettingsPage } from "./presentation/pages/SettingsPage";

export default function App() {
  return (
    <>
      {/* New notifications pop up as toasts on every page while logged in */}
      <LiveNotifications />
      <Routes>
        {/* Only for logged-out visitors */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Only for logged-in users */}
        <Route element={<ProtectedRoute />}>
          {/* With the shared header (and the Keep a memory dialog) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<JournalPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route
              path="/notifications/unavailable"
              element={<NotificationUnavailablePage />}
            />
          </Route>

          <Route path="/memories/new" element={<Navigate to="/" replace />} />

          {/* Full screen, no header */}
          <Route path="/memories/:memoryId" element={<MemoryViewerPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
