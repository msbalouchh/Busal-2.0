import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { AuthFormSkeleton } from "@/modules/auth/components/auth-form-skeleton";
import { CustomerPortalRegisterForm } from "@/modules/customer-portal/components/customer-portal-auth-forms";

export const metadata: Metadata = {
  title: "Customer Registration",
};

export default function CustomerPortalRegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Register with your business code to access the customer portal"
    >
      <Suspense fallback={<AuthFormSkeleton />}>
        <CustomerPortalRegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
