import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "../../domain/user";
import {
  changePassword,
  removeProfilePhoto,
  updateProfile,
  uploadProfilePhoto,
  type PasswordInput,
  type ProfileInput,
} from "../../infrastructure/api/accountApi";
import { refreshEverythingShowingMe, rememberUser } from "../auth/authCache";

// After a change to my name, username or photo: update the header right away,
// and reload whatever shows me elsewhere
function useSaveMe() {
  const queryClient = useQueryClient();
  return (user: User) => {
    rememberUser(queryClient, user);
    refreshEverythingShowingMe(queryClient);
  };
}

export function useUpdateProfile() {
  const saveMe = useSaveMe();
  return useMutation({
    mutationFn: async (input: ProfileInput) => await updateProfile(input),
    onSuccess: saveMe,
  });
}

export function useUploadProfilePhoto() {
  const saveMe = useSaveMe();
  return useMutation({
    mutationFn: async (photo: File) => await uploadProfilePhoto(photo),
    onSuccess: saveMe,
  });
}

export function useRemoveProfilePhoto() {
  const saveMe = useSaveMe();
  return useMutation({
    mutationFn: async () => await removeProfilePhoto(),
    onSuccess: saveMe,
  });
}

// Nothing on screen changes; other devices get logged out by the server
export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: PasswordInput) => await changePassword(input),
  });
}
