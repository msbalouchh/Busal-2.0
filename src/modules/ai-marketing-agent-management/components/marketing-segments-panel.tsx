"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPence } from "@/modules/ai-marketing-agent-management/lib/ai-marketing-agent-validation";
import { MarketingAgentNav } from "@/modules/ai-marketing-agent-management/components/marketing-agent-nav";
import type { CustomerSegment } from "@/services/ai-marketing-segmentation.service";

interface MarketingSegmentsPanelProps {
  segments: CustomerSegment[];
}

export function MarketingSegmentsPanel({ segments }: MarketingSegmentsPanelProps) {
  return (
    <div className="space-y-8">
      <MarketingAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer segments ({segments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No segments found.</p>
          ) : (
            <ul className="space-y-4">
              {segments.map((segment) => (
                <li key={segment.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{segment.name}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {segment.customerCount} customers · Avg LTV{" "}
                        {formatPence(segment.avgSpendPence)}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{formatPence(segment.totalSpendPence)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
