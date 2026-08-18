import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthFormSkeleton } from "@/modules/auth/components/auth-form-skeleton";
import { LoginForm } from "@/modules/auth/components/login-form";
import { buildBrandedAuthMetadata } from "@/modules/platform/lib/auth-page-metadata";
import { PlatformAuthShell } from "@/modules/platform/components/platform-auth-shell";

export async function generateMetadata(): Promise<Metadata> {
  return buildBrandedAuthMetadata("Sign In");
}

export default function LoginPage() {
  return (
    <PlatformAuthShell title="Welcome back" description="Sign in to your Busal OS account">
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </PlatformAuthShell>
  );
}
