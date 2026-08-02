"use client";

import { Building2, KeyRound, Shield, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterprisePlatformNav } from "@/modules/enterprise-platform-management/components/enterprise-platform-nav";
import type { EnterprisePlatformContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";
import type {
  EnterpriseAuditRecord,
  EnterpriseSummaryRecord,
  OrganizationRecord,
} from "@/modules/enterprise-platform-management/types/enterprise-platform-types";

interface EnterpriseDashboardPanelProps {
  context: EnterprisePlatformContext;
  summary: EnterpriseSummaryRecord;
  organizations: OrganizationRecord[];
  recentAudit: EnterpriseAuditRecord[];
}

export function EnterpriseDashboardPanel({
  context,
  summary,
  organizations,
  recentAudit,
}: EnterpriseDashboardPanelProps) {
  const cards = [
    { label: "Organizations", value: summary.organizationCount, icon: Building2 },
    { label: "Active Orgs", value: summary.activeOrganizations, icon: Users },
    { label: "Identity Providers", value: summary.identityProviderCount, icon: KeyRound },
    { label: "Policies", value: summary.policyCount, icon: Shield },
    { label: "Compliance Score", value: `${summary.complianceScore}%`, icon: ShieldCheck },
    { label: "Audit Events (7d)", value: summary.auditEvents7d, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8">
      <EnterprisePlatformNav />
      <p className="text-muted-foreground text-sm">
        Enterprise identity and organization management for{" "}
        {context.business.businessName ?? "your business"}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {organizations.slice(0, 6).map((org) => (
                <li key={org.id} className="flex items-center justify-between">
                  <span className="font-medium">{org.name}</span>
                  <Badge variant="outline">{org.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent audit</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="text-muted-foreground text-sm">No audit events yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentAudit.map((entry) => (
                  <li key={entry.id}>
                    <span className="font-medium">{entry.action}</span>
                    {entry.message ? ` — ${entry.message}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
