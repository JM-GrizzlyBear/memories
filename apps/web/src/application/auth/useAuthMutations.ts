import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  login,
  register,
  type LoginInput,
  type RegisterInput,
} from "../../infrastructure/api/authApi";
import { rememberUser } from "./authCache";

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => await login(input),
    onSuccess: (user) => rememberUser(queryClient, user),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: RegisterInput) => await register(input),
  });
}
