"use client";

import { useTransition } from "react";
import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportAnalyticsReportAction } from "@/modules/restaurant-analytics-management/actions/restaurant-analytics-actions";
import type {
  AnalyticsFilters,
  ExportReportRequest,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";
import type { ReportType } from "@prisma/client";

interface ExportReportButtonsProps {
  reportType: ReportType;
  filters: AnalyticsFilters;
  title?: string;
  canExport: boolean;
}

const FORMATS: ExportReportRequest["format"][] = ["csv", "excel", "pdf"];

export function ExportReportButtons({
  reportType,
  filters,
  title,
  canExport,
}: ExportReportButtonsProps) {
  const [isPending, startTransition] = useTransition();

  if (!canExport) return null;

  const handleExport = (format: ExportReportRequest["format"]) => {
    startTransition(async () => {
      const result = await exportAnalyticsReportAction({ reportType, format, filters, title });
      if (!result.success || !result.data) return;

      const blob = new Blob(
        [Uint8Array.from(atob(result.data.contentBase64), (c) => c.charCodeAt(0))],
        { type: result.data.mimeType },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.data.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FORMATS.map((format) => (
        <Button
          key={format}
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleExport(format)}
        >
          <Download className="mr-2 h-4 w-4" />
          {format.toUpperCase()}
        </Button>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
    </div>
  );
}
