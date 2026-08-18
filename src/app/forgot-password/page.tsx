import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";
import { buildBrandedAuthMetadata } from "@/modules/platform/lib/auth-page-metadata";
import { PlatformAuthShell } from "@/modules/platform/components/platform-auth-shell";

export async function generateMetadata(): Promise<Metadata> {
  return buildBrandedAuthMetadata("Forgot Password");
}

export default function ForgotPasswordPage() {
  return (
    <PlatformAuthShell
      title="Reset your password"
      description="Enter your email and we'll send you a reset link"
    >
      <ForgotPasswordForm />
    </PlatformAuthShell>
  );
}
