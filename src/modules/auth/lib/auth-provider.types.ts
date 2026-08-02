import type { AuthUser } from "@/types/auth";
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  ResetPasswordFormValues,
  SignupFormValues,
} from "@/schemas/auth.schema";

/** Contract for future Supabase / Auth.js / custom auth backends. */
export interface AuthProvider {
  loginWithEmail(values: LoginFormValues): Promise<{ user: AuthUser; redirectPath?: string }>;
  signupWithEmail(
    values: SignupFormValues,
  ): Promise<{ user: AuthUser | null; requiresEmailConfirmation: boolean }>;
  requestPasswordReset(values: ForgotPasswordFormValues): Promise<{ message: string }>;
  resetPassword(values: ResetPasswordFormValues): Promise<{ user: AuthUser }>;
  getGoogleSignInUrl(): Promise<{ url: string }>;
  resendVerificationEmail(email: string): Promise<{ message: string }>;
}
