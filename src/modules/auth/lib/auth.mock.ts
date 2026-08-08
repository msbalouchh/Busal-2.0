import { ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import type { AuthUser } from "@/types/auth";
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  ResetPasswordFormValues,
  SignupFormValues,
} from "@/schemas/auth.schema";

const MOCK_DELAY_MS = 850;

function delay(ms = MOCK_DELAY_MS) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildMockUser(partial: Pick<AuthUser, "email" | "fullName">): AuthUser {
  return {
    id: "mock-user-0001",
    email: partial.email,
    fullName: partial.fullName,
    role: USER_ROLES.OWNER,
    tenantId: null,
  };
}

/** TODO: Replace mock implementations with Supabase / Auth.js provider. */
export async function mockLoginWithEmail(values: LoginFormValues) {
  await delay();
  // TODO: Supabase signInWithPassword, session cookies, MFA challenge
  return {
    user: buildMockUser({ email: values.email, fullName: "Busal Operator" }),
    redirectPath: ROUTES.application,
  };
}

/** TODO: Replace with real signup + email confirmation flow. */
export async function mockSignupWithEmail(values: SignupFormValues) {
  await delay();
  // TODO: Supabase signUp, tenant provisioning, welcome email
  void values.businessName;
  return {
    user: null,
    requiresEmailConfirmation: true,
  };
}

/** TODO: Replace with Supabase resetPasswordForEmail. */
export async function mockRequestPasswordReset(values: ForgotPasswordFormValues) {
  await delay();
  void values;
  return { message: "If an account exists, a reset link has been sent." };
}

/** TODO: Replace with Supabase updateUser / exchangeCodeForSession. */
export async function mockResetPassword(values: ResetPasswordFormValues) {
  await delay();
  void values;
  return {
    user: buildMockUser({ email: "operator@getbusal.com", fullName: "Busal Operator" }),
  };
}

/** TODO: Replace with Supabase signInWithOAuth({ provider: 'google' }). */
export async function mockGetGoogleSignInUrl(): Promise<{ url: string }> {
  await delay(400);
  throw new Error("Google OAuth integration is coming soon.");
}

/** @deprecated Use resendVerificationEmail from auth.service via API route. */
export async function mockResendVerificationEmail(_email: string) {
  throw new Error("Mock resend is disabled. Use the production resend verification API.");
}
