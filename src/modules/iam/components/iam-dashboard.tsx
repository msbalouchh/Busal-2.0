import type { IamDashboardView } from "@/modules/iam/utils/iam-utils";

interface IamDashboardProps {
  dashboard: IamDashboardView;
}

export function IamDashboard({ dashboard }: IamDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Identities</p>
        <p className="text-2xl font-semibold">{dashboard.totalIdentities}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Sessions</p>
        <p className="text-2xl font-semibold">{dashboard.activeSessions}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">API Keys</p>
        <p className="text-2xl font-semibold">{dashboard.apiKeys}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Service Accounts</p>
        <p className="text-2xl font-semibold">{dashboard.serviceAccounts}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Access Policies</p>
        <p className="text-2xl font-semibold">{dashboard.policies}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">MFA Enrollments</p>
        <p className="text-2xl font-semibold">{dashboard.mfaEnrollments}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Failed Logins (24h)</p>
        <p className="text-2xl font-semibold">{dashboard.failedLogins24h}</p>
      </div>
    </div>
  );
}
