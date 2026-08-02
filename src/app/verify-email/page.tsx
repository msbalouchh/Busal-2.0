import type { Metadata } from "next";

import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { VerifyEmailPanel } from "@/modules/auth/components/verify-email-panel";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify your email"
      description="One more step before your Busal OS workspace goes live."
    >
      <VerifyEmailPanel />
    </AuthLayout>
  );
}
