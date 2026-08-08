"use client";

import { FileText, Loader2, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generatePlatformCeoReportAction } from "@/modules/control-center/platform-ceo/actions/platform-ceo-intelligence-actions";
import { PLATFORM_CEO_ROUTES } from "@/modules/control-center/platform-ceo/constants/platform-ceo";
import type {
  ExecutiveReportKind,
  PlatformCeoExecutiveReport,
  PlatformCeoReportsBundle,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";

interface PlatformCeoReportsHubProps {
  initialBundle: PlatformCeoReportsBundle;
}

const REPORT_ACTIONS: Array<{ kind: ExecutiveReportKind; label: string }> = [
  { kind: "morning_brief", label: "Morning Brief" },
  { kind: "evening_summary", label: "Evening Summary" },
  { kind: "weekly_board", label: "Weekly Report" },
  { kind: "monthly_executive", label: "Monthly Report" },
  { kind: "revenue_forecast", label: "Revenue Forecast" },
  { kind: "growth_forecast", label: "Growth Forecast" },
  { kind: "churn_forecast", label: "Churn Forecast" },
  { kind: "platform_health", label: "Platform Health" },
  { kind: "risk_analysis", label: "Risk Analysis" },
  { kind: "priority_queue", label: "Priority Queue" },
  { kind: "opportunities", label: "Opportunities" },
];

function ReportCard({ report }: { report: PlatformCeoExecutiveReport }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{report.title}</CardTitle>
        <div className="text-muted-foreground text-xs">
          {report.periodLabel} · {new Date(report.generatedAt).toLocaleString("en-GB")}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="mb-1 font-medium">Executive Summary</div>
          <p className="text-muted-foreground">{report.advisory.executiveSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-muted rounded-full px-2 py-0.5">
            Confidence: {report.advisory.confidence}%
          </span>
          <span className="bg-muted rounded-full px-2 py-0.5 capitalize">
            Priority: {report.advisory.priority}
          </span>
          <span className="bg-muted rounded-full px-2 py-0.5">
            {report.recommendations.length} recommendations
          </span>
          <span className="bg-muted rounded-full px-2 py-0.5">
            {report.risks.length} risks
          </span>
        </div>
        {report.advisory.recommendedActions.length > 0 ? (
          <div>
            <div className="mb-1 font-medium">Recommended Actions (Advisory Only)</div>
            <ul className="text-muted-foreground list-disc space-y-1 pl-4">
              {report.advisory.recommendedActions.slice(0, 3).map((action) => (
                <li key={action.id}>
                  [{action.priority}] {action.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PlatformCeoReportsHub({ initialBundle }: PlatformCeoReportsHubProps) {
  const [bundle, setBundle] = useState(initialBundle);
  const [selectedReport, setSelectedReport] = useState<PlatformCeoExecutiveReport | null>(
    bundle.latestMorningBrief ?? bundle.reports[0] ?? null,
  );
  const [isPending, startTransition] = useTransition();

  function handleGenerate(kind: ExecutiveReportKind) {
    startTransition(async () => {
      try {
        const report = await generatePlatformCeoReportAction(kind);
        setBundle((current) => ({
          ...current,
          reports: [report, ...current.reports.filter((entry) => entry.id !== report.id)],
          latestMorningBrief:
            kind === "morning_brief" ? report : current.latestMorningBrief,
          latestWeeklyReport:
            kind === "weekly_board" ? report : current.latestWeeklyReport,
          latestMonthlyReport:
            kind === "monthly_executive" ? report : current.latestMonthlyReport,
          refreshedAt: new Date().toISOString(),
        }));
        setSelectedReport(report);
        toast.success(`${report.title} generated`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to generate report");
      }
    });
  }

  return (
    <PageContainer>
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeader
          title="Executive Reports"
          description="Platform CEO intelligence reports — advisory only, no autonomous execution."
        />
        <Button variant="outline" size="sm" asChild>
          <Link href={PLATFORM_CEO_ROUTES.hub}>
            <Sparkles className="mr-2 h-4 w-4" />
            Back to CEO
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {REPORT_ACTIONS.map((action) => (
          <Button
            key={action.kind}
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => handleGenerate(action.kind)}
          >
            {isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="mr-1 h-3.5 w-3.5" />
            )}
            {action.label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleGenerate("morning_brief")}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh Morning Brief
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historical Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[520px] px-4 pb-4">
              {bundle.reports.length === 0 ? (
                <ControlCenterEmptyState
                  title="No reports yet"
                  description="Generate a morning brief, weekly report, or monthly report to begin."
                />
              ) : (
                <div className="space-y-2">
                  {bundle.reports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      className={`w-full rounded-md border p-2 text-left text-sm ${
                        selectedReport?.id === report.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-border"
                      }`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="font-medium">{report.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(report.generatedAt).toLocaleString("en-GB")}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedReport ? (
            <ReportCard report={selectedReport} />
          ) : (
            <ControlCenterEmptyState
              title="Select a report"
              description="Choose a historical report or generate a new executive brief."
            />
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Latest Morning Brief</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {bundle.latestMorningBrief?.advisory.executiveSummary ??
                  "Not generated yet."}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Latest Weekly Report</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {bundle.latestWeeklyReport?.advisory.executiveSummary ?? "Not generated yet."}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Latest Monthly Report</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {bundle.latestMonthlyReport?.advisory.executiveSummary ?? "Not generated yet."}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
