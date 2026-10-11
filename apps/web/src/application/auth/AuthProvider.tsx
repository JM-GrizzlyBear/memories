import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, type ReactNode } from "react";
import type { User } from "../../domain/user";
import {
  getCurrentUser,
  logout as logoutRequest,
} from "../../infrastructure/api/authApi";
import { queryKeys } from "../query/queryKeys";
import { AuthContext } from "./AuthContext";
import { rememberUser } from "./authCache";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Who is logged in? Asked when the app starts, and again now and then
  // (when you come back to the tab), so an ended session shows the login page
  const { data, isPending } = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => await getCurrentUser(), // null when nobody is
    staleTime: 5 * 60_000,
    retry: false, // API down: show the login page instead of waiting
  });

  const setUser = useCallback(
    (user: User | null) => rememberUser(queryClient, user),
    [queryClient],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    rememberUser(queryClient, null);
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{ user: data ?? null, isLoading: isPending, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
