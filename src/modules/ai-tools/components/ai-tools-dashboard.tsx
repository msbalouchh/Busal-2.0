import type {
  AiToolExecutionView,
  AiToolsDashboardView,
} from "@/modules/ai-tools/utils/ai-tools-utils";

interface AiToolsDashboardProps {
  dashboard: AiToolsDashboardView;
  recentExecutions: AiToolExecutionView[];
}

export function AiToolsDashboard({ dashboard, recentExecutions }: AiToolsDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Registered Tools</p>
          <p className="text-2xl font-semibold">{dashboard.totalTools}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Active Tools</p>
          <p className="text-2xl font-semibold">{dashboard.activeTools}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Successful Executions</p>
          <p className="text-2xl font-semibold">{dashboard.successfulExecutions}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Awaiting Confirmation</p>
          <p className="text-2xl font-semibold">{dashboard.awaitingConfirmation}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium">Recent Executions</h2>
        {recentExecutions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tool executions yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentExecutions.map((execution) => (
              <li key={execution.id} className="flex items-center justify-between gap-4">
                <span className="font-medium">{execution.toolId}</span>
                <span className="text-muted-foreground">{execution.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
