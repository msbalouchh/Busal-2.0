import type { Metadata } from "next";

import { VerifyEmailPanel } from "@/modules/auth/components/verify-email-panel";
import { buildBrandedAuthMetadata } from "@/modules/platform/lib/auth-page-metadata";
import { PlatformAuthShell } from "@/modules/platform/components/platform-auth-shell";

export async function generateMetadata(): Promise<Metadata> {
  return buildBrandedAuthMetadata("Verify Email");
}

export default function VerifyEmailPage() {
  return (
    <PlatformAuthShell
      title="Verify your email"
      description="One more step before your Busal OS workspace goes live."
    >
      <VerifyEmailPanel />
    </PlatformAuthShell>
  );
}
