"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createPolicyAction,
  togglePolicyAction,
} from "@/modules/enterprise-platform-management/actions/enterprise-platform-actions";
import { EnterprisePlatformNav } from "@/modules/enterprise-platform-management/components/enterprise-platform-nav";
import type { EnterprisePlatformContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";
import type {
  EnterprisePolicyRecord,
  OrganizationRecord,
} from "@/modules/enterprise-platform-management/types/enterprise-platform-types";

interface EnterprisePoliciesPanelProps {
  context: EnterprisePlatformContext;
  policies: EnterprisePolicyRecord[];
  organizations: OrganizationRecord[];
}

export function EnterprisePoliciesPanel({
  context,
  policies,
  organizations,
}: EnterprisePoliciesPanelProps) {
  const [pending, startTransition] = useTransition();
  const defaultOrgId = organizations[0]?.id ?? "";

  return (
    <div className="space-y-8">
      <EnterprisePlatformNav />

      {context.permissionsFlags.canManagePolicies && defaultOrgId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create policy</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap gap-2"
              action={(formData) => {
                startTransition(async () => {
                  await createPolicyAction({
                    organizationId: defaultOrgId,
                    name: String(formData.get("name") ?? ""),
                    category: "SECURITY",
                  });
                });
              }}
            >
              <Input name="name" placeholder="Policy name" required className="max-w-xs" />
              <Button type="submit" disabled={pending}>
                Create security policy
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enterprise policies</CardTitle>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <p className="text-muted-foreground text-sm">No policies configured.</p>
          ) : (
            <ul className="space-y-3">
              {policies.map((policy) => (
                <li key={policy.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{policy.name}</span>
                    <Badge variant="outline">{policy.category}</Badge>
                    <Badge variant={policy.enabled ? "default" : "secondary"}>
                      {policy.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {context.permissionsFlags.canManagePolicies && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(() => togglePolicyAction(policy.id, !policy.enabled))
                      }
                    >
                      {policy.enabled ? "Disable" : "Enable"}
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
