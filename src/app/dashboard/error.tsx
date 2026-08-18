"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle, Lock, Rocket, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PLATFORM_GUARD_ERROR_CODES,
  PLATFORM_GUARD_ERROR_MESSAGES,
} from "@/modules/platform-guards/constants/errors";
import { ROUTES } from "@/constants/routes";

interface DashboardErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function resolveGuardPresentation(error: Error): {
  title: string;
  description: string;
  icon: typeof AlertCircle;
  actionHref?: string;
  actionLabel?: string;
} | null {
  const message = error.message.trim();

  if (message === PLATFORM_GUARD_ERROR_MESSAGES[PLATFORM_GUARD_ERROR_CODES.PERMISSION_DENIED]) {
    return {
      title: "Access restricted",
      description: "You do not have permission to view this workspace module.",
      icon: Lock,
    };
  }

  if (message === PLATFORM_GUARD_ERROR_MESSAGES[PLATFORM_GUARD_ERROR_CODES.ONBOARDING_REQUIRED]) {
    return {
      title: "Setup required",
      description: "Complete business onboarding before accessing this module.",
      icon: Rocket,
      actionHref: ROUTES.businessOnboarding,
      actionLabel: "Continue setup",
    };
  }

  if (message === PLATFORM_GUARD_ERROR_MESSAGES[PLATFORM_GUARD_ERROR_CODES.BUSINESS_NOT_ACTIVE]) {
    return {
      title: "Business inactive",
      description: "This business is not active. Contact your administrator to restore access.",
      icon: ShieldAlert,
    };
  }

  if (message === PLATFORM_GUARD_ERROR_MESSAGES[PLATFORM_GUARD_ERROR_CODES.BUSINESS_REQUIRED]) {
    return {
      title: "Business required",
      description: "Select or configure a business before opening this module.",
      icon: ShieldAlert,
      actionHref: ROUTES.businessOnboarding,
      actionLabel: "Configure business",
    };
  }

  if (message === PLATFORM_GUARD_ERROR_MESSAGES[PLATFORM_GUARD_ERROR_CODES.STAFF_INACTIVE]) {
    return {
      title: "Account inactive",
      description: "Your staff account is inactive. Ask a manager to re-enable your access.",
      icon: ShieldAlert,
    };
  }

  if (message === PLATFORM_GUARD_ERROR_MESSAGES[PLATFORM_GUARD_ERROR_CODES.ROLE_REQUIRED]) {
    return {
      title: "Role required",
      description: "Your account does not have the role required for this module.",
      icon: Lock,
    };
  }

  if (message.includes("Upgrade required") || message.includes("is not included in your")) {
    return {
      title: "Plan upgrade required",
      description: message,
      icon: Lock,
    };
  }

  return null;
}

export default function DashboardErrorPage({ error, reset }: DashboardErrorPageProps) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  const guardPresentation = resolveGuardPresentation(error);

  if (guardPresentation) {
    const Icon = guardPresentation.icon;

    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <Icon className="text-muted-foreground h-6 w-6" />
            </div>
            <CardTitle>{guardPresentation.title}</CardTitle>
            <CardDescription>{guardPresentation.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {guardPresentation.actionHref ? (
              <Button asChild>
                <Link href={guardPresentation.actionHref}>{guardPresentation.actionLabel}</Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href={ROUTES.dashboard}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive h-6 w-6" />
          </div>
          <CardTitle>Unable to load this page</CardTitle>
          <CardDescription>
            Something went wrong while loading this workspace module. Your data is safe — try again
            or return to the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" ? (
            <pre className="bg-muted overflow-auto rounded-md p-4 text-xs">{error.message}</pre>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.dashboard}>Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
