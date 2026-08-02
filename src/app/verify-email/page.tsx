import Link from "next/link";

import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify your email"
      description="We sent a confirmation link to your inbox. Click the link to activate your account."
    >
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground text-sm">
          After verifying, sign in to complete your business setup and launch Busal OS.
        </p>
        <Button asChild className="w-full">
          <Link href={ROUTES.login}>Back to sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
