"use client";

import { ShieldOff } from "lucide-react";
import Link from "next/link";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

export function ControlCenterUnauthorizedPage() {
  return (
    <PageContainer title="Access Denied" className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="text-destructive h-5 w-5" aria-hidden="true" />
            Unauthorized
          </CardTitle>
          <CardDescription>
            Your account is authenticated but not authorized for Busal Control Center operator
            access.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="default">
            <Link href={ROUTES.dashboard}>Return to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.login}>Sign in with another account</Link>
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
