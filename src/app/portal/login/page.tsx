import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { AuthFormSkeleton } from "@/modules/auth/components/auth-form-skeleton";
import { CustomerPortalLoginForm } from "@/modules/customer-portal/components/customer-portal-auth-forms";

export const metadata: Metadata = {
  title: "Customer Sign In",
};

export default function CustomerPortalLoginPage() {
  return (
    <AuthLayout title="Welcome back" description="Sign in to your customer portal">
      <Suspense fallback={<AuthFormSkeleton />}>
        <CustomerPortalLoginForm />
      </Suspense>
    </AuthLayout>
  );
}
