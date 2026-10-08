import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./presentation/components/layout/AppLayout";
import { GuestRoute } from "./presentation/components/routing/GuestRoute";
import { ProtectedRoute } from "./presentation/components/routing/ProtectedRoute";
import { KeepMemoryPage } from "./presentation/pages/KeepMemoryPage";
import { LoginPage } from "./presentation/pages/LoginPage";
import { RegisterPage } from "./presentation/pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      {/* Only for logged-out visitors */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Only for logged-in users, all with the shared header */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Until the Journal exists (step 3.5), home is the Keep a memory page */}
          <Route path="/" element={<Navigate to="/memories/new" replace />} />
          <Route path="/memories/new" element={<KeepMemoryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
