import { createContext } from "react";
import type { User } from "../../domain/user";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean; // true while we're still asking the API "who am I?"
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
