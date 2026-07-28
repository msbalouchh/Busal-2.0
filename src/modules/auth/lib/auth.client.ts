import { API_ROUTES } from "@/constants/routes";
import type { AuthUser } from "@/types/auth";
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  ResetPasswordFormValues,
  SignupFormValues,
} from "@/schemas/auth.schema";

interface ApiSuccessResponse {
  success: true;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

type ApiResponse<T> = (ApiSuccessResponse & T) | ApiErrorResponse;

async function parseAuthResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    const message =
      "error" in data && data.error
        ? data.error
        : "An unexpected error occurred. Please try again.";
    throw new Error(message);
  }

  return data;
}

export async function loginWithEmail(values: LoginFormValues) {
  const response = await fetch(API_ROUTES.login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(values),
  });

  return parseAuthResponse<{ user: AuthUser }>(response);
}

export async function signupWithEmail(values: SignupFormValues) {
  const response = await fetch(API_ROUTES.signup, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(values),
  });

  return parseAuthResponse<{ user: AuthUser | null; requiresEmailConfirmation: boolean }>(response);
}

export async function requestPasswordReset(values: ForgotPasswordFormValues) {
  const response = await fetch(API_ROUTES.forgotPassword, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(values),
  });

  return parseAuthResponse<{ message: string }>(response);
}

export async function resetPassword(values: ResetPasswordFormValues) {
  const response = await fetch(API_ROUTES.resetPassword, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(values),
  });

  return parseAuthResponse<{ user: AuthUser }>(response);
}

export async function getGoogleSignInUrl() {
  const response = await fetch(API_ROUTES.google, {
    method: "GET",
    credentials: "include",
  });

  return parseAuthResponse<{ url: string }>(response);
}

export async function fetchSession() {
  const response = await fetch(API_ROUTES.session, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch session");
  }

  const data = (await response.json()) as ApiResponse<{ user: AuthUser }>;

  if (!data.success) {
    return null;
  }

  return data.user;
}
