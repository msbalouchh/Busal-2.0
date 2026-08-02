"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import { INTEGRATION_PLATFORM_ROUTES } from "@/modules/integration-platform-management/constants/routes";
import type { IntegrationPlatformContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";
import type { IntegrationProviderRecord } from "@/modules/integration-platform-management/types/integration-platform-types";

interface IntegrationProvidersPanelProps {
  context: IntegrationPlatformContext;
  providers: IntegrationProviderRecord[];
}

export function IntegrationProvidersPanel({ context, providers }: IntegrationProvidersPanelProps) {
  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Browse available integration providers and connect apps to your workspace.
        </p>
        {context.permissionsFlags.canCreate ? (
          <Button asChild>
            <Link href={INTEGRATION_PLATFORM_ROUTES.connectionNew()}>Connect app</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{provider.name}</CardTitle>
                <Badge variant="outline">{provider.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {(provider.configuration.description as string) ?? "Integration provider"}
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary">{provider.status}</Badge>
                <Badge variant="outline">{provider.connectionCount} connections</Badge>
              </div>
              {context.permissionsFlags.canCreate ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`${INTEGRATION_PLATFORM_ROUTES.connectionNew()}?providerId=${provider.id}`}
                  >
                    Connect
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
