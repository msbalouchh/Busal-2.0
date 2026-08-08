"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/query";
import { ROUTES } from "@/constants/routes";
import { assignAppPath } from "@/lib/app-navigation";
import {
  getGoogleSignInUrl,
  loginWithEmail,
  requestPasswordReset,
  resendVerificationEmail,
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
  const setUser = useAuthStore((state) => state.setUser);
  const invalidateSession = useInvalidateSession();

  return useMutation({
    mutationFn: (values: LoginFormValues) => loginWithEmail({ ...values, redirectTo }),
    onSuccess: (data) => {
      setUser(data.user);
      invalidateSession();
      toast.success("Welcome back!");

      const target = data.redirectPath ?? redirectTo;
      if (target && target !== ROUTES.authContinue) {
        const params = new URLSearchParams({ redirectTo: target });
        assignAppPath(`${ROUTES.authContinue}?${params.toString()}`);
        return;
      }

      assignAppPath(ROUTES.authContinue);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSignup() {
  const setUser = useAuthStore((state) => state.setUser);
  const invalidateSession = useInvalidateSession();

  return useMutation({
    mutationFn: signupWithEmail,
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
        invalidateSession();
        toast.success("Workspace created successfully!");
        assignAppPath(ROUTES.businessOnboarding);
        return;
      }

      toast.success("Check your email to verify your account.");
      assignAppPath(ROUTES.verifyEmail);
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
    mutationFn: requestPasswordReset,
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useResetPassword() {
  const setUser = useAuthStore((state) => state.setUser);
  const invalidateSession = useInvalidateSession();

  return useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      setUser(data.user);
      invalidateSession();
      toast.success("Password updated successfully!");
      assignAppPath(ROUTES.login);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => {
      toast.success("Verification email sent.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
