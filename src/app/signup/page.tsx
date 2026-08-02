import type { Metadata } from "next";

import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { SignupForm } from "@/modules/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your workspace"
      description="Launch Busal OS for your business in minutes"
    >
      <SignupForm />
    </AuthLayout>
  );
}
