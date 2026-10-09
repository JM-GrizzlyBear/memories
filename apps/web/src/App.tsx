import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./presentation/components/layout/AppLayout";
import { GuestRoute } from "./presentation/components/routing/GuestRoute";
import { ProtectedRoute } from "./presentation/components/routing/ProtectedRoute";
import { JournalPage } from "./presentation/pages/JournalPage";
import { LoginPage } from "./presentation/pages/LoginPage";
import { MemoryViewerPage } from "./presentation/pages/MemoryViewerPage";
import { RegisterPage } from "./presentation/pages/RegisterPage";

export default function App() {
  return (
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
        </Route>

        <Route path="/memories/new" element={<Navigate to="/" replace />} />

        {/* Full screen, no header */}
        <Route path="/memories/:memoryId" element={<MemoryViewerPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
