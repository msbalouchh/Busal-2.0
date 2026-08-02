"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterprisePlatformNav } from "@/modules/enterprise-platform-management/components/enterprise-platform-nav";
import type {
  ComplianceSummaryRecord,
  EnterpriseAuditRecord,
} from "@/modules/enterprise-platform-management/types/enterprise-platform-types";

interface EnterpriseCompliancePanelProps {
  compliance: ComplianceSummaryRecord;
  audit: EnterpriseAuditRecord[];
}

export function EnterpriseCompliancePanel({ compliance, audit }: EnterpriseCompliancePanelProps) {
  return (
    <div className="space-y-8">
      <EnterprisePlatformNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Compliance score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{compliance.score}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Policies enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {compliance.enabledPolicies}/{compliance.totalPolicies}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active providers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {compliance.activeProviders}/{compliance.totalProviders}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Policy categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{compliance.categories.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By category</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {compliance.categories.map((cat) => (
                <li key={cat.category} className="flex justify-between">
                  <span>{cat.category}</span>
                  <Badge variant="outline">
                    {cat.enabled}/{cat.total}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance audit trail</CardTitle>
          </CardHeader>
          <CardContent>
            {audit.length === 0 ? (
              <p className="text-muted-foreground text-sm">No audit events.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {audit.map((entry) => (
                  <li key={entry.id}>
                    <span className="font-medium">{entry.action}</span> — {entry.message}
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
