import { Navigate, Route, Routes } from "react-router";
import { LoginPage } from "./presentation/pages/LoginPage";
import { RegisterPage } from "./presentation/pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* For now, send everyone else to /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
