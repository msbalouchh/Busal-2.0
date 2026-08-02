"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createOrganizationAction } from "@/modules/enterprise-platform-management/actions/enterprise-platform-actions";
import { EnterprisePlatformNav } from "@/modules/enterprise-platform-management/components/enterprise-platform-nav";
import { ENTERPRISE_PLATFORM_ROUTES } from "@/modules/enterprise-platform-management/constants/routes";
import type { EnterprisePlatformContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";
import type { OrganizationRecord } from "@/modules/enterprise-platform-management/types/enterprise-platform-types";

interface EnterpriseOrganizationsPanelProps {
  context: EnterprisePlatformContext;
  organizations: OrganizationRecord[];
}

export function EnterpriseOrganizationsPanel({
  context,
  organizations,
}: EnterpriseOrganizationsPanelProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <EnterprisePlatformNav />

      {context.permissionsFlags.canManageOrganizations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create organization</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap gap-2"
              action={(formData) => {
                startTransition(async () => {
                  await createOrganizationAction({
                    name: String(formData.get("name") ?? ""),
                    slug: String(formData.get("slug") ?? ""),
                    industry: String(formData.get("industry") ?? ""),
                  });
                });
              }}
            >
              <Input name="name" placeholder="Organization name" required className="max-w-xs" />
              <Input name="slug" placeholder="slug" required className="max-w-[140px]" />
              <Input name="industry" placeholder="Industry" className="max-w-[140px]" />
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No organizations yet.</p>
          ) : (
            <ul className="space-y-3">
              {organizations.map((org) => (
                <li key={org.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{org.name}</span>
                    <Badge variant="outline">{org.status}</Badge>
                    <Badge variant="secondary">{org.slug}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    {org.unitCount} units · {org.providerCount} providers · {org.policyCount}{" "}
                    policies
                  </p>
                  <Link
                    href={ENTERPRISE_PLATFORM_ROUTES.settings(org.id)}
                    className="text-primary text-sm hover:underline"
                  >
                    Settings
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
