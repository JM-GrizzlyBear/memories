import { useEffect, useState, type ReactNode } from "react";
import type { User } from "../../domain/user";
import {
  getCurrentUser,
  logout as logoutRequest,
} from "../../infrastructure/api/authApi";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Runs once when the app starts: ask the API who is logged in
  useEffect(() => {
    async function loadCurrentUser() {
      try {
        setUser(await getCurrentUser());
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  async function logout() {
    await logoutRequest();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
