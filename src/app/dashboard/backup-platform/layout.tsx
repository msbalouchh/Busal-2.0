import type { Metadata } from "next";

import { BackupPlatformNav } from "@/modules/backup-platform/components/backup-platform-nav";

export const metadata: Metadata = {
  title: "Backup & Disaster Recovery",
};

export default function BackupPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Backup & Disaster Recovery Platform
        </h1>
        <p className="text-muted-foreground text-sm">
          Centralized backup, point-in-time recovery, and disaster recovery for all Busal services.
        </p>
      </div>
      <BackupPlatformNav />
      {children}
    </div>
  );
}
