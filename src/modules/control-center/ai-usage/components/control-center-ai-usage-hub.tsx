"use client";

import {
  Activity,
  Download,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
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
  exportControlCenterAiUsageAction,
  refreshControlCenterAiUsageAction,
} from "@/modules/control-center/ai-usage/actions/control-center-ai-usage-actions";
import {
  AI_USAGE_RANGE_OPTIONS,
  AI_USAGE_SECTIONS,
} from "@/modules/control-center/ai-usage/constants/control-center-ai-usage";
import type {
  ControlCenterAiUsageBundle,
  ControlCenterAiUsageKpi,
  ControlCenterAiUsageRange,
} from "@/modules/control-center/ai-usage/types/control-center-ai-usage-types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { ControlCenterErrorState } from "@/modules/control-center/components/dashboard/error-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";

interface ControlCenterAiUsageHubProps {
  initialBundle: ControlCenterAiUsageBundle;
}

function formatKpiValue(kpi: ControlCenterAiUsageKpi): string {
  switch (kpi.format) {
    case "currency":
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 2,
      }).format(kpi.value / 100);
    case "percent":
    case "rate":
      return `${kpi.value}%`;
    case "duration":
      return kpi.value >= 1000 ? `${(kpi.value / 1000).toFixed(1)}s` : `${kpi.value}ms`;
    default:
      return new Intl.NumberFormat("en-GB").format(kpi.value);
  }
}

function formatGrowthTrend(growthPct: number | null): string | undefined {
  if (growthPct === null) return undefined;
  if (growthPct === 0) return "0% vs prior period";
  return `${growthPct > 0 ? "+" : ""}${growthPct}% vs prior period`;
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

export function ControlCenterAiUsageHub({ initialBundle }: ControlCenterAiUsageHubProps) {
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState(initialBundle);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rangeDays, setRangeDays] = useState<ControlCenterAiUsageRange>(bundle.rangeDays);
  const [comparePrevious, setComparePrevious] = useState(bundle.comparePrevious);
  const [activeSection, setActiveSection] = useState("all");
  const [provider, setProvider] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [model, setModel] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [page, setPage] = useState(1);

  const filteredSections = useMemo(() => {
    if (activeSection === "all") return bundle.sections;
    return bundle.sections.filter((section) => section.id === activeSection);
  }, [activeSection, bundle.sections]);

  const buildQuery = (nextPage = page) => ({
    rangeDays,
    comparePrevious,
    search: search.trim() || undefined,
    section: activeSection === "all" ? undefined : activeSection,
    page: nextPage,
    provider: provider || undefined,
    businessId: businessId || undefined,
    model: model || undefined,
    module: moduleFilter || undefined,
  });

  const refresh = (nextPage = page) => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await refreshControlCenterAiUsageAction(buildQuery(nextPage));
        setBundle(next);
      } catch (refreshError) {
        const message =
          refreshError instanceof Error ? refreshError.message : "Unable to refresh AI usage";
        setError(message);
        toast.error(message);
      }
    });
  };

  const handleExport = (format: "csv" | "json") => {
    startTransition(async () => {
      try {
        const result = await exportControlCenterAiUsageAction(buildQuery(), format);
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
          description="You do not have permission to view AI usage analytics."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="AI Usage Dashboard"
        description="Executive AI overview with provider, model, business, and cost analytics."
        action={
          <div className="flex flex-wrap items-center gap-2">
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
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="ai-range">Date range</Label>
          <select
            id="ai-range"
            value={String(rangeDays)}
            onChange={(event) => {
              setRangeDays(Number(event.target.value) as ControlCenterAiUsageRange);
              setPage(1);
            }}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            {AI_USAGE_RANGE_OPTIONS.map((days) => (
              <option key={days} value={String(days)}>
                Last {days} days
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-section">Section</Label>
          <select
            id="ai-section"
            value={activeSection}
            onChange={(event) => {
              setActiveSection(event.target.value);
              setPage(1);
            }}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="all">All sections</option>
            {AI_USAGE_SECTIONS.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-provider">Provider</Label>
          <select
            id="ai-provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All providers</option>
            {bundle.filterOptions.providers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-business">Business</Label>
          <select
            id="ai-business"
            value={businessId}
            onChange={(event) => setBusinessId(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All businesses</option>
            {bundle.filterOptions.businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-model">Model</Label>
          <select
            id="ai-model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All models</option>
            {bundle.filterOptions.models.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-module">Module</Label>
          <select
            id="ai-module"
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All modules</option>
            {bundle.filterOptions.modules.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="ai-search">Search businesses</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              id="ai-search"
              className="pl-9"
              placeholder="Business name or owner email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setPage(1);
                  refresh(1);
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
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
          <ControlCenterErrorState title="Unable to load AI usage" description={error} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {bundle.executiveKpis.map((kpi) => (
          <PlatformStatCard
            key={kpi.id}
            title={kpi.label}
            value={formatKpiValue(kpi)}
            icon={Activity}
            trend={comparePrevious ? formatGrowthTrend(kpi.growthPct) : undefined}
            description={
              comparePrevious && kpi.previousValue !== null
                ? `Previous: ${formatKpiValue({ ...kpi, value: kpi.previousValue })}`
                : `Updated ${new Intl.DateTimeFormat("en-GB", { timeStyle: "short" }).format(new Date(bundle.refreshedAt))}`
            }
          />
        ))}
      </div>

      {filteredSections.length === 0 ? (
        <div className="mt-8">
          <ControlCenterEmptyState
            title="No AI usage data"
            description="Try adjusting filters or date range."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {filteredSections.map((section) => (
            <section key={section.id} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="text-muted-foreground text-sm">{section.description}</p>
              </div>

              {section.kpis.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {section.kpis.map((kpi) => (
                    <PlatformStatCard
                      key={`${section.id}-${kpi.id}`}
                      title={kpi.label}
                      value={formatKpiValue(kpi)}
                      trend={comparePrevious ? formatGrowthTrend(kpi.growthPct) : undefined}
                    />
                  ))}
                </div>
              ) : null}

              {section.trends.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {section.trends.map((trend) => (
                    <Card key={`${section.id}-${trend.id}`}>
                      <CardHeader>
                        <CardTitle className="text-base">{trend.label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {trend.points.every((point) => point.value === 0) ? (
                          <ControlCenterEmptyState
                            title="No trend data"
                            description="No AI activity recorded in this period."
                          />
                        ) : (
                          <AnalyticsTrendBars points={trend.points} />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}

              {section.monthlyTrends.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnalyticsTrendBars
                      points={section.monthlyTrends.map((point) => ({
                        day: point.month,
                        value: point.value,
                      }))}
                    />
                  </CardContent>
                </Card>
              ) : null}

              {section.tables.map((table) => (
                <Card key={`${section.id}-${table.id}`}>
                  <CardHeader>
                    <CardTitle className="text-base">{table.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {table.rows.length === 0 ? (
                      <ControlCenterEmptyState
                        title="No records"
                        description="Nothing to display for the current filters."
                      />
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Details</TableHead>
                              <TableHead className="text-right">
                                {table.rows[0]?.metricLabel ?? "Metric"}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {table.rows.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.primary}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {row.secondary ?? "—"}
                                </TableCell>
                                <TableCell className="text-right">{row.metric}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {table.totalPages > 1 ? (
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-muted-foreground text-sm">
                              Page {table.page} of {table.totalPages} ({table.total} total)
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isPending || table.page <= 1}
                                onClick={() => {
                                  const nextPage = table.page - 1;
                                  setPage(nextPage);
                                  refresh(nextPage);
                                }}
                              >
                                Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isPending || table.page >= table.totalPages}
                                onClick={() => {
                                  const nextPage = table.page + 1;
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
              ))}
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
