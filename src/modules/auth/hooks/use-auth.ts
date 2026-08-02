"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/query";
import { ROUTES } from "@/constants/routes";
import {
  getGoogleSignInUrl,
  loginWithEmail,
  requestPasswordReset,
  resetPassword,
  signupWithEmail,
} from "@/modules/auth/lib/auth.client";
import { useAuthStore } from "@/stores/auth.store";
import type { LoginFormValues } from "@/schemas/auth.schema";

function useInvalidateSession() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session });
  };
}

export function useLogin(redirectTo?: string) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const invalidateSession = useInvalidateSession();

  return useMutation({
    mutationFn: (values: LoginFormValues) => loginWithEmail({ ...values, redirectTo }),
    onSuccess: (data) => {
      setUser(data.user);
      invalidateSession();
      toast.success("Welcome back!");
      router.push(data.redirectPath ?? redirectTo ?? ROUTES.application);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSignup() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const invalidateSession = useInvalidateSession();

  return useMutation({
    mutationFn: signupWithEmail,
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
        invalidateSession();
        toast.success("Account created successfully!");
        router.push(ROUTES.businessOnboarding);
        router.refresh();
        return;
      }

      toast.success("Check your email to confirm your account before signing in.");
      router.push(ROUTES.verifyEmail);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useGoogleSignIn() {
  return useMutation({
    mutationFn: getGoogleSignInUrl,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: requestPasswordReset,
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useResetPassword() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const invalidateSession = useInvalidateSession();

  return useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      setUser(data.user);
      invalidateSession();
      toast.success("Password updated successfully!");
      router.push(ROUTES.dashboard);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
