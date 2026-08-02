"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createDepartmentAction } from "@/modules/enterprise-platform-management/actions/enterprise-platform-actions";
import { EnterprisePlatformNav } from "@/modules/enterprise-platform-management/components/enterprise-platform-nav";
import type { EnterprisePlatformContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";
import type {
  OrganizationRecord,
  OrganizationUnitRecord,
} from "@/modules/enterprise-platform-management/types/enterprise-platform-types";

interface EnterpriseDepartmentsPanelProps {
  context: EnterprisePlatformContext;
  departments: OrganizationUnitRecord[];
  organizations: OrganizationRecord[];
}

export function EnterpriseDepartmentsPanel({
  context,
  departments,
  organizations,
}: EnterpriseDepartmentsPanelProps) {
  const [pending, startTransition] = useTransition();
  const defaultOrgId = organizations[0]?.id ?? "";

  return (
    <div className="space-y-8">
      <EnterprisePlatformNav />

      {context.permissionsFlags.canManageOrganizations && defaultOrgId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add department / unit</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap gap-2"
              action={(formData) => {
                startTransition(async () => {
                  await createDepartmentAction({
                    organizationId: String(formData.get("organizationId") ?? defaultOrgId),
                    name: String(formData.get("name") ?? ""),
                    type: String(formData.get("type") ?? "department"),
                  });
                });
              }}
            >
              <input type="hidden" name="organizationId" value={defaultOrgId} />
              <Input name="name" placeholder="Unit name" required className="max-w-xs" />
              <Input
                name="type"
                placeholder="Type"
                defaultValue="department"
                className="max-w-[140px]"
              />
              <Button type="submit" disabled={pending}>
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Departments & business units</CardTitle>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No units configured.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {departments.map((unit) => (
                <li key={unit.id} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{unit.name}</span>
                  <Badge variant="outline">{unit.type}</Badge>
                  {unit.organizationName && (
                    <Badge variant="secondary">{unit.organizationName}</Badge>
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
