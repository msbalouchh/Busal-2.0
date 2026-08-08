"use client";

import { Activity, Download, Loader2, RefreshCw, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnalyticsTrendBars } from "@/modules/control-center/analytics/components/analytics-trend-bars";
import {
  exportPlatformIntelligenceAction,
  refreshPlatformIntelligenceAction,
} from "@/modules/control-center/platform-intelligence/actions/platform-intelligence-actions";
import {
  INTELLIGENCE_DRILL_DOWN_OPTIONS,
  INTELLIGENCE_RANGE_OPTIONS,
} from "@/modules/control-center/platform-intelligence/constants/platform-intelligence";
import type {
  PlatformIntelligenceBundle,
  PlatformIntelligenceRange,
  PlatformIntelligenceScore,
} from "@/modules/control-center/platform-intelligence/types/platform-intelligence-types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { ControlCenterErrorState } from "@/modules/control-center/components/dashboard/error-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";

interface PlatformIntelligenceHubProps {
  initialBundle: PlatformIntelligenceBundle;
}

function formatScoreValue(score: PlatformIntelligenceScore): string {
  switch (score.format) {
    case "currency":
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
      }).format(score.value / 100);
    case "percent":
      return `${score.value}%`;
    case "number":
      return new Intl.NumberFormat("en-GB").format(score.value);
    default:
      return `${score.value}/100`;
  }
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" | null }) {
  if (!level) return <span className="text-muted-foreground text-xs">—</span>;
  const classes =
    level === "high"
      ? "bg-destructive/10 text-destructive"
      : level === "medium"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-emerald-500/10 text-emerald-600";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${classes}`}>
      {level}
    </span>
  );
}

function downloadExport(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function BusinessList({
  title,
  rows,
}: {
  title: string;
  rows: PlatformIntelligenceBundle["topBusinesses"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <ControlCenterEmptyState title="No data" description="No businesses match this list." />
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.map((row, index) => (
              <li key={row.id} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">
                    {index + 1}. {row.name}
                  </div>
                  <div className="text-muted-foreground text-xs">{row.secondary}</div>
                </div>
                <div className="text-right">
                  <div>{row.metric}</div>
                  <RiskBadge level={row.riskLevel} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PlatformIntelligenceHub({ initialBundle }: PlatformIntelligenceHubProps) {
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState(initialBundle);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<string>(String(bundle.range));
  const [comparePrevious, setComparePrevious] = useState(bundle.comparePrevious);
  const [drillDown, setDrillDown] = useState("platform");
  const [drillDownId, setDrillDownId] = useState("");
  const [page, setPage] = useState(bundle.businessHealthRankings.page);

  const buildQuery = (nextPage = page) => ({
    range: (range === "all" ? "all" : Number(range)) as PlatformIntelligenceRange,
    comparePrevious,
    search: search.trim() || undefined,
    drillDown: drillDown as "platform" | "tenant" | "workspace" | "business" | "module",
    drillDownId: drillDownId.trim() || undefined,
    page: nextPage,
  });

  const refresh = (nextPage = page) => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await refreshPlatformIntelligenceAction(buildQuery(nextPage));
        setBundle(next);
        setPage(next.businessHealthRankings.page);
      } catch (refreshError) {
        const message =
          refreshError instanceof Error ? refreshError.message : "Unable to refresh intelligence";
        setError(message);
        toast.error(message);
      }
    });
  };

  const handleExport = (format: "csv" | "json") => {
    startTransition(async () => {
      try {
        const result = await exportPlatformIntelligenceAction(buildQuery(), format);
        downloadExport(result.filename, result.content, result.mimeType);
        toast.success(`Exported ${format.toUpperCase()}`);
      } catch (exportError) {
        toast.error(exportError instanceof Error ? exportError.message : "Export failed");
      }
    });
  };

  if (!bundle.permissions.canView) {
    return (
      <PageContainer>
        <ControlCenterErrorState
          title="Access denied"
          description="You do not have permission to view platform intelligence."
        />
      </PageContainer>
    );
  }

  const headlineScores = bundle.platformScores.slice(0, 8);

  return (
    <PageContainer>
      <SectionHeader
        title="Platform Intelligence"
        description="Executive intelligence across health, growth, revenue, AI adoption, risk, and operational performance."
        action={
          <div className="flex flex-wrap gap-2">
            {bundle.permissions.canExport ? (
              <>
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("csv")}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("json")}>
                  <Download className="mr-2 h-4 w-4" />
                  JSON
                </Button>
              </>
            ) : null}
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => refresh()}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="intel-range">Date range</Label>
          <select
            id="intel-range"
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            {INTELLIGENCE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="intel-drill">Drill-down</Label>
          <select
            id="intel-drill"
            value={drillDown}
            onChange={(event) => setDrillDown(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            {INTELLIGENCE_DRILL_DOWN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="intel-drill-id">Drill-down ID</Label>
          <Input
            id="intel-drill-id"
            placeholder="Business / tenant / workspace ID"
            value={drillDownId}
            onChange={(event) => setDrillDownId(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="intel-search">Search businesses</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              id="intel-search"
              className="pl-9"
              placeholder="Business name or owner email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && refresh(1)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={comparePrevious}
            onChange={(event) => setComparePrevious(event.target.checked)}
          />
          Compare to previous period
        </label>
        <Button disabled={isPending} onClick={() => refresh(1)}>
          Apply filters
        </Button>
      </div>

      {error ? (
        <div className="mt-6">
          <ControlCenterErrorState title="Unable to load intelligence" description={error} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {headlineScores.map((score) => (
          <PlatformStatCard
            key={score.id}
            title={score.label}
            value={formatScoreValue(score)}
            icon={Activity}
            description={
              score.previousValue !== null
                ? `Previous: ${formatScoreValue({ ...score, value: score.previousValue })}`
                : undefined
            }
          />
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly executive summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">{bundle.executiveSummary.weekly}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly executive summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">{bundle.executiveSummary.monthly}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {bundle.trends.map((trend) => (
          <Card key={trend.id}>
            <CardHeader>
              <CardTitle className="text-base">{trend.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {trend.points.every((point) => point.value === 0) ? (
                <ControlCenterEmptyState title="No trend data" description="No activity in this period." />
              ) : (
                <AnalyticsTrendBars points={trend.points} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {bundle.alerts.length === 0 ? (
              <ControlCenterEmptyState title="No active alerts" description="Platform signals look stable." />
            ) : (
              <ul className="space-y-3">
                {bundle.alerts.map((alert) => (
                  <li key={alert.id} className="rounded-lg border p-3">
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-muted-foreground text-sm">{alert.description}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {bundle.recommendations.length === 0 ? (
              <ControlCenterEmptyState title="No recommendations" description="No actions suggested right now." />
            ) : (
              <ul className="space-y-3">
                {bundle.recommendations.map((item) => (
                  <li key={item.id} className="rounded-lg border p-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-muted-foreground text-sm">{item.description}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Operational insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
            {bundle.operationalInsights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <BusinessList title="Top 10 businesses" rows={bundle.topBusinesses} />
        <BusinessList title="Fastest growing businesses" rows={bundle.fastestGrowing} />
        <BusinessList title="At-risk businesses" rows={bundle.atRiskBusinesses} />
        <BusinessList title="Dormant businesses" rows={bundle.dormantBusinesses} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">{bundle.businessHealthRankings.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {bundle.businessHealthRankings.rows.length === 0 ? (
            <ControlCenterEmptyState title="No rankings" description="Adjust filters to see business health data." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Health score</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundle.businessHealthRankings.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-muted-foreground text-xs">{row.workspaceId}</div>
                      </TableCell>
                      <TableCell>{row.score}/100</TableCell>
                      <TableCell>{row.metric}</TableCell>
                      <TableCell>
                        <RiskBadge level={row.riskLevel} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {bundle.businessHealthRankings.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    Page {bundle.businessHealthRankings.page} of {bundle.businessHealthRankings.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending || bundle.businessHealthRankings.page <= 1}
                      onClick={() => {
                        const nextPage = bundle.businessHealthRankings.page - 1;
                        setPage(nextPage);
                        refresh(nextPage);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        isPending ||
                        bundle.businessHealthRankings.page >= bundle.businessHealthRankings.totalPages
                      }
                      onClick={() => {
                        const nextPage = bundle.businessHealthRankings.page + 1;
                        setPage(nextPage);
                        refresh(nextPage);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
