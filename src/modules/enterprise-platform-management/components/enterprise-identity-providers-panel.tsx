"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  activateIdentityProviderAction,
  createIdentityProviderAction,
} from "@/modules/enterprise-platform-management/actions/enterprise-platform-actions";
import { EnterprisePlatformNav } from "@/modules/enterprise-platform-management/components/enterprise-platform-nav";
import type { EnterprisePlatformContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";
import type {
  IdentityProviderRecord,
  OrganizationRecord,
} from "@/modules/enterprise-platform-management/types/enterprise-platform-types";

interface EnterpriseIdentityProvidersPanelProps {
  context: EnterprisePlatformContext;
  providers: IdentityProviderRecord[];
  organizations: OrganizationRecord[];
}

export function EnterpriseIdentityProvidersPanel({
  context,
  providers,
  organizations,
}: EnterpriseIdentityProvidersPanelProps) {
  const [pending, startTransition] = useTransition();
  const defaultOrgId = organizations[0]?.id ?? "";

  return (
    <div className="space-y-8">
      <EnterprisePlatformNav />

      {context.permissionsFlags.canManageIdentity && defaultOrgId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add identity provider (framework)</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap gap-2"
              action={(formData) => {
                startTransition(async () => {
                  await createIdentityProviderAction({
                    organizationId: defaultOrgId,
                    name: String(formData.get("name") ?? ""),
                    providerType: "SAML",
                  });
                });
              }}
            >
              <Input name="name" placeholder="Provider name" required className="max-w-xs" />
              <Button type="submit" disabled={pending}>
                Add SAML framework
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identity providers</CardTitle>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No identity providers configured.</p>
          ) : (
            <ul className="space-y-3">
              {providers.map((provider) => (
                <li key={provider.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{provider.name}</span>
                    <Badge variant="outline">{provider.providerType}</Badge>
                    <Badge>{provider.status}</Badge>
                    <Badge variant="secondary">{provider.framework} framework</Badge>
                  </div>
                  {context.permissionsFlags.canManageIdentity && provider.status === "PENDING" && (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        startTransition(() => activateIdentityProviderAction(provider.id))
                      }
                    >
                      Activate (simulated)
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
