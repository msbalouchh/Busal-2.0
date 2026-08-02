"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteSavedReportAction } from "@/modules/restaurant-analytics-management/actions/restaurant-analytics-actions";
import { AnalyticsNav } from "@/modules/restaurant-analytics-management/components/analytics-nav";
import {
  REPORT_TYPE_OPTIONS,
  RESTAURANT_ANALYTICS_ROUTES,
} from "@/modules/restaurant-analytics-management/constants/routes";
import { REPORT_TYPE_LABELS } from "@/modules/restaurant-analytics-management/lib/restaurant-analytics-validation";
import type { RestaurantAnalyticsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import type { SavedReportRecord } from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";

interface SavedReportsPanelProps {
  context: RestaurantAnalyticsContext;
  reports: SavedReportRecord[];
}

export function SavedReportsPanel({ context, reports }: SavedReportsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (reportId: string) => {
    if (!window.confirm("Delete this saved report?")) return;
    startTransition(async () => {
      await deleteSavedReportAction(reportId);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Saved Reports</h2>
          <p className="text-muted-foreground text-sm">Custom reports saved for quick access.</p>
        </div>
        {context.permissionsFlags.canCreateReport ? (
          <Button asChild>
            <Link href={RESTAURANT_ANALYTICS_ROUTES.reportBuilder()}>
              <Plus className="mr-2 h-4 w-4" />
              New report
            </Link>
          </Button>
        ) : null}
      </div>

      <AnalyticsNav />

      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            No saved reports yet. Create a custom report to save filters and report type.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">
                    <Link
                      href={RESTAURANT_ANALYTICS_ROUTES.savedReport(report.id)}
                      className="hover:underline"
                    >
                      {report.name}
                    </Link>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {REPORT_TYPE_LABELS[report.reportType]}
                    {report.isPublic ? " · Public" : " · Private"}
                  </p>
                </div>
                {context.permissionsFlags.canDeleteReport ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => handleDelete(report.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </CardHeader>
              {report.description ? (
                <CardContent className="text-muted-foreground text-sm">
                  {report.description}
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-medium">Available report types</h3>
        <div className="flex flex-wrap gap-2">
          {REPORT_TYPE_OPTIONS.map((option) => (
            <span key={option.value} className="bg-muted rounded-md px-2 py-1 text-xs">
              {option.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
