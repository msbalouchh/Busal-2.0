import type { Metadata } from "next";

import { MonitoringPlatformNav } from "@/modules/monitoring-platform/components/monitoring-platform-nav";

export const metadata: Metadata = {
  title: "Monitoring & Observability",
};

export default function MonitoringPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Monitoring & Observability Platform
        </h1>
        <p className="text-muted-foreground text-sm">
          Centralized monitoring for health, performance, reliability, and operational status across
          every Busal service.
        </p>
      </div>
      <MonitoringPlatformNav />
      {children}
    </div>
  );
}
