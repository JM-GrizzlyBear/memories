import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkResetLink,
  getPasswordResetStatus,
  requestPasswordReset,
  resetPassword,
  type ResetPasswordInput,
} from "../../infrastructure/api/passwordResetApi";
import { rememberUser } from "./authCache";

export function usePasswordResetStatus() {
  return useQuery({
    queryKey: ["passwordReset", "status"],
    queryFn: async () => await getPasswordResetStatus(),
    staleTime: Infinity,
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => await requestPasswordReset(email),
    meta: { errorToast: false }, // shown on the page
  });
}

export function useResetLink(token: string) {
  return useQuery({
    queryKey: ["passwordReset", "link", token],
    queryFn: async () => await checkResetLink(token),
    enabled: token !== "",
    retry: false,
    meta: { errorToast: false },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ResetPasswordInput) => await resetPassword(input),
    // Every session of this account was ended, this browser's too
    onSuccess: () => rememberUser(queryClient, null),
    meta: { errorToast: false },
  });
}
