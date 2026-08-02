"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/query";
import { ROUTES } from "@/constants/routes";
/**
 * TODO: Swap mock imports for `@/modules/auth/lib/auth.client` when Supabase / Auth.js
 * backend integration is enabled.
 */
import {
  mockGetGoogleSignInUrl,
  mockLoginWithEmail,
  mockRequestPasswordReset,
  mockResendVerificationEmail,
  mockResetPassword,
  mockSignupWithEmail,
} from "@/modules/auth/lib/auth.mock";
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
    mutationFn: (values: LoginFormValues) => mockLoginWithEmail({ ...values, redirectTo }),
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
    mutationFn: mockSignupWithEmail,
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
        invalidateSession();
        toast.success("Workspace created successfully!");
        router.push(ROUTES.businessOnboarding);
        router.refresh();
        return;
      }

      toast.success("Check your email to verify your account.");
      router.push(ROUTES.verifyEmail);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useGoogleSignIn() {
  return useMutation({
    mutationFn: mockGetGoogleSignInUrl,
    onSuccess: (data) => {
      // TODO: Microsoft OAuth, magic links
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: mockRequestPasswordReset,
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
    mutationFn: mockResetPassword,
    onSuccess: (data) => {
      setUser(data.user);
      invalidateSession();
      toast.success("Password updated successfully!");
      router.push(ROUTES.login);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: mockResendVerificationEmail,
    onSuccess: () => {
      toast.success("Verification email sent.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
