"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createIntegrationConnectionAction } from "@/modules/integration-platform-management/actions/integration-platform-actions";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import { INTEGRATION_PLATFORM_ROUTES } from "@/modules/integration-platform-management/constants/routes";
import type { IntegrationPlatformContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";
import type { IntegrationProviderRecord } from "@/modules/integration-platform-management/types/integration-platform-types";

interface IntegrationConnectionWizardProps {
  context: IntegrationPlatformContext;
  providers: IntegrationProviderRecord[];
}

export function IntegrationConnectionWizard({
  context,
  providers,
}: IntegrationConnectionWizardProps) {
  const searchParams = useSearchParams();
  const defaultProviderId = searchParams.get("providerId") ?? providers[0]?.id ?? "";
  const [providerId, setProviderId] = useState(defaultProviderId);
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!context.permissionsFlags.canCreate) {
    return (
      <div className="space-y-8">
        <IntegrationPlatformNav />
        <p className="text-muted-foreground text-sm">
          You do not have permission to create connections.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Connection wizard</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await createIntegrationConnectionAction({
                  providerId,
                  displayName,
                  apiKey: apiKey || undefined,
                  apiSecret: apiSecret || undefined,
                });
                window.location.href = INTEGRATION_PLATFORM_ROUTES.connectionDetail(result.id);
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <select
                id="provider"
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API key (encrypted at rest)</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API secret (encrypted at rest)</Label>
              <Input
                id="apiSecret"
                type="password"
                value={apiSecret}
                onChange={(event) => setApiSecret(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create connection"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
