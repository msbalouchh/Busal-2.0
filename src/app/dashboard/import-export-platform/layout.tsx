import type { Metadata } from "next";

import { ImportExportPlatformNav } from "@/modules/import-export-platform/components/import-export-platform-nav";

export const metadata: Metadata = {
  title: "Data Import & Export",
};

export default function ImportExportPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Data Import & Export Platform</h1>
        <p className="text-muted-foreground text-sm">
          Centralized import and export for CSV, Excel, JSON, and PDF across all Busal OS modules.
        </p>
      </div>
      <ImportExportPlatformNav />
      {children}
    </div>
  );
}
