"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSavedReportAction } from "@/modules/restaurant-analytics-management/actions/restaurant-analytics-actions";
import { AnalyticsFiltersBar } from "@/modules/restaurant-analytics-management/components/analytics-filters-bar";
import { AnalyticsNav } from "@/modules/restaurant-analytics-management/components/analytics-nav";
import {
  REPORT_TYPE_OPTIONS,
  RESTAURANT_ANALYTICS_ROUTES,
} from "@/modules/restaurant-analytics-management/constants/routes";
import type { RestaurantAnalyticsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import type { ReportType } from "@prisma/client";

interface ReportBuilderPanelProps {
  context: RestaurantAnalyticsContext;
}

export function ReportBuilderPanel({ context }: ReportBuilderPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reportType, setReportType] = useState<ReportType>("SALES");
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = () => {
    startTransition(async () => {
      const report = await createSavedReportAction({
        name,
        description: description || null,
        reportType,
        filters: context.filters,
        isPublic,
      });
      router.push(RESTAURANT_ANALYTICS_ROUTES.savedReport(report.id));
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Report Builder</h2>
        <p className="text-muted-foreground text-sm">
          Configure filters and save a reusable report for your team.
        </p>
      </div>

      <AnalyticsNav />
      <AnalyticsFiltersBar
        context={context}
        basePath={RESTAURANT_ANALYTICS_ROUTES.reportBuilder()}
      />

      <Card>
        <CardHeader>
          <CardTitle>Report details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-name">Name</Label>
            <Input
              id="report-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Weekly sales summary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description">Description</Label>
            <textarea
              id="report-description"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={description}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(event.target.value)
              }
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-type">Report type</Label>
            <select
              id="report-type"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              value={reportType}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                setReportType(event.target.value as ReportType)
              }
            >
              {REPORT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
            />
            Share with all staff who can view analytics
          </label>

          <div className="flex gap-2">
            <Button type="button" disabled={isPending || !name.trim()} onClick={handleSubmit}>
              Save report
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={RESTAURANT_ANALYTICS_ROUTES.reports()}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
