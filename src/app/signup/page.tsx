import type { Metadata } from "next";

import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { SignupForm } from "@/modules/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Get started with Busal OS as a business owner"
    >
      <SignupForm />
    </AuthLayout>
  );
}
