import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { LoginForm } from "@/modules/auth/components/login-form";
import { AuthFormSkeleton } from "@/modules/auth/components/auth-form-skeleton";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" description="Sign in to your Busal OS account">
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
