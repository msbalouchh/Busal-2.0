import type { BackupPlatformDashboardView } from "@/modules/backup-platform/utils/backup-platform-utils";

interface BackupPlatformDashboardProps {
  dashboard: BackupPlatformDashboardView;
}

export function BackupPlatformDashboard({ dashboard }: BackupPlatformDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Backups</p>
        <p className="text-2xl font-semibold">{dashboard.totalBackups}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Verified</p>
        <p className="text-2xl font-semibold">{dashboard.verifiedBackups}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Failed</p>
        <p className="text-2xl font-semibold">{dashboard.failedBackups}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Recent (7d)</p>
        <p className="text-2xl font-semibold">{dashboard.recentBackups}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Recoveries</p>
        <p className="text-2xl font-semibold">{dashboard.activeRecoveryJobs}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Completed Recoveries</p>
        <p className="text-2xl font-semibold">{dashboard.completedRecoveries}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Registered Policies</p>
        <p className="text-2xl font-semibold">{dashboard.registeredPolicies}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">DR Plans</p>
        <p className="text-2xl font-semibold">{dashboard.drPlans}</p>
      </div>
    </div>
  );
}
