import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";
import { getCurrentUser } from "@/services/auth.service";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  return (
    <AuthLayout title="Set a new password" description="Choose a strong password for your account">
      <ResetPasswordForm />
    </AuthLayout>
  );
}
