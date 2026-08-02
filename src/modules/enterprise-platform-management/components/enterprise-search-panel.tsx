"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EnterprisePlatformNav } from "@/modules/enterprise-platform-management/components/enterprise-platform-nav";
import { ENTERPRISE_PLATFORM_ROUTES } from "@/modules/enterprise-platform-management/constants/routes";
import type { OrganizationRecord } from "@/modules/enterprise-platform-management/types/enterprise-platform-types";

interface EnterpriseSearchPanelProps {
  search: string;
  organizations: OrganizationRecord[];
}

export function EnterpriseSearchPanel({ search, organizations }: EnterpriseSearchPanelProps) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <EnterprisePlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search enterprise data</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const query = String(formData.get("q") ?? "").trim();
              router.push(
                query
                  ? `${ENTERPRISE_PLATFORM_ROUTES.search()}?q=${encodeURIComponent(query)}`
                  : ENTERPRISE_PLATFORM_ROUTES.search(),
              );
            }}
          >
            <Input name="q" defaultValue={search} placeholder="Search organizations..." />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {search && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organizations ({organizations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {organizations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matching organizations.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {organizations.map((org) => (
                  <li key={org.id} className="flex items-center gap-2">
                    <Link
                      href={ENTERPRISE_PLATFORM_ROUTES.settings(org.id)}
                      className="font-medium hover:underline"
                    >
                      {org.name}
                    </Link>
                    <Badge variant="outline">{org.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
