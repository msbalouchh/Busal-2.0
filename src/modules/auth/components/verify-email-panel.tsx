"use client";

import { Mail } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { AuthSubmitButton } from "@/modules/auth/components/auth-submit-button";
import { useResendVerificationEmail } from "@/modules/auth/hooks/use-auth";

export function VerifyEmailPanel() {
  const resend = useResendVerificationEmail();

  return (
    <div className="auth-verify">
      <div className="auth-verify__icon" aria-hidden="true">
        <Mail className="h-8 w-8" />
      </div>

      <p className="auth-verify__message">
        We sent a verification link to your inbox. Open the email and confirm your address to
        activate your Busal OS workspace.
      </p>

      <AuthSubmitButton
        type="button"
        isLoading={resend.isPending}
        loadingLabel="Sending…"
        onClick={() => resend.mutate("operator@getbusal.com")}
      >
        Resend verification email
      </AuthSubmitButton>

      <Link href={ROUTES.login} className="auth-link auth-link--muted">
        Back to sign in
      </Link>
    </div>
  );
}
