import type { AutomationDashboardView } from "@/modules/ai-automation/utils/ai-automation-utils";

interface AiAutomationDashboardProps {
  dashboard: AutomationDashboardView;
}

export function AiAutomationDashboard({ dashboard }: AiAutomationDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Executions</p>
        <p className="text-2xl font-semibold">{dashboard.totalExecutions}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Success Rate</p>
        <p className="text-2xl font-semibold">{(dashboard.successRate * 100).toFixed(0)}%</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Pending Approvals</p>
        <p className="text-2xl font-semibold">{dashboard.pendingApprovals}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Failures</p>
        <p className="text-2xl font-semibold">{dashboard.failures}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Avg Duration</p>
        <p className="text-2xl font-semibold">{dashboard.averageDurationMs}ms</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">AI Decisions</p>
        <p className="text-2xl font-semibold">{dashboard.aiDecisions}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">AI Token Cost</p>
        <p className="text-2xl font-semibold">{dashboard.totalAiTokens}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Events Published</p>
        <p className="text-2xl font-semibold">{dashboard.totalEvents}</p>
      </div>
    </div>
  );
}
