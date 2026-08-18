import type { Metadata } from "next";

import { SignupForm } from "@/modules/auth/components/signup-form";
import { buildBrandedAuthMetadata } from "@/modules/platform/lib/auth-page-metadata";
import { PlatformAuthShell } from "@/modules/platform/components/platform-auth-shell";

export async function generateMetadata(): Promise<Metadata> {
  return buildBrandedAuthMetadata("Sign Up");
}

export default function SignupPage() {
  return (
    <PlatformAuthShell
      title="Create your workspace"
      description="Launch Busal OS for your business in minutes"
    >
      <SignupForm />
    </PlatformAuthShell>
  );
}
