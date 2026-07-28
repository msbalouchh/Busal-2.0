"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type {
  ReportingExportFormat,
  ReportingExportReportType,
} from "@/modules/reporting/constants/routes";
import { exportReportAction } from "@/modules/reporting/actions/reporting-actions";

interface ExportReportButtonsProps {
  reportType: ReportingExportReportType;
}

const FORMATS: ReportingExportFormat[] = ["csv", "excel", "pdf"];

export function ExportReportButtons({ reportType }: ExportReportButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleExport = (format: ReportingExportFormat) => {
    startTransition(async () => {
      const result = await exportReportAction({ reportType, format });

      if (!result.success || !result.data) {
        return;
      }

      const blob = new Blob(
        [Uint8Array.from(atob(result.data.contentBase64), (c) => c.charCodeAt(0))],
        {
          type: result.data.mimeType,
        },
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
          Export {format.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
