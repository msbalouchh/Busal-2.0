import type { Metadata } from "next";

import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

/** TODO: Validate reset token from searchParams when Supabase / Auth.js is wired. */
export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Set a new password" description="Choose a strong password for your account">
      <ResetPasswordForm />
    </AuthLayout>
  );
}
