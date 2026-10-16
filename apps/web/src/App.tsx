import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./presentation/components/layout/AppLayout";
import { GuestRoute } from "./presentation/components/routing/GuestRoute";
import { HomeRoute } from "./presentation/components/routing/HomeRoute";
import { ProtectedRoute } from "./presentation/components/routing/ProtectedRoute";
import { FriendsPage } from "./presentation/pages/FriendsPage";
import { JournalPage } from "./presentation/pages/JournalPage";
import { LoginPage } from "./presentation/pages/LoginPage";
import { useRealtimeConnection } from "./application/realtime/useRealtime";
import { ChatDockProvider } from "./presentation/components/messages/ChatDockProvider";
import { LiveMessages } from "./presentation/components/messages/LiveMessages";
import { LiveNotifications } from "./presentation/components/notification/LiveNotifications";
import { MessagesPage } from "./presentation/pages/MessagesPage";
import { MemoryViewerPage } from "./presentation/pages/MemoryViewerPage";
import { NotificationUnavailablePage } from "./presentation/pages/NotificationUnavailablePage";
import { NotificationsPage } from "./presentation/pages/NotificationsPage";
import { ProfilePage } from "./presentation/pages/ProfilePage";
import { RegisterPage } from "./presentation/pages/RegisterPage";
import { SettingsPage } from "./presentation/pages/SettingsPage";

export default function App() {
  // One live connection while logged in (notifications, messages, typing)
  useRealtimeConnection();

  return (
    // Chat windows (bottom right) stay open while moving around the app
    <ChatDockProvider>
      {/* New notifications and messages pop up as toasts on every page */}
      <LiveNotifications />
      <LiveMessages />
      <Routes>
        {/* Only for logged-out visitors */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* "/": the landing page for visitors, the journal once logged in */}
        <Route path="/" element={<HomeRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<JournalPage />} />
          </Route>
        </Route>

        {/* Only for logged-in users */}
        <Route element={<ProtectedRoute />}>
          {/* With the shared header (and the Keep a memory dialog) */}
          <Route element={<AppLayout />}>
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route
              path="/u/:username/album"
              element={<ProfilePage view="album" />}
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/requests" element={<MessagesPage />} />
            <Route path="/messages/archive" element={<MessagesPage />} />
            <Route
              path="/messages/c/:conversationId"
              element={<MessagesPage />}
            />
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
    </ChatDockProvider>
  );
}
