import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./application/auth/AuthProvider.tsx";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
