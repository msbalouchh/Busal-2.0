"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudPlatformNav } from "@/modules/cloud-platform-management/components/cloud-platform-nav";
import type { QuotaRecord } from "@/modules/cloud-platform-management/types/cloud-platform-types";

interface CloudQuotasPanelProps {
  quotas: QuotaRecord[];
}

export function CloudQuotasPanel({ quotas }: CloudQuotasPanelProps) {
  return (
    <div className="space-y-8">
      <CloudPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quota dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {quotas.map((q) => (
              <li key={q.resource} className="flex justify-between">
                <span>{q.resource}</span>
                <Badge variant={q.status === "exceeded" ? "destructive" : "outline"}>
                  {q.status}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
