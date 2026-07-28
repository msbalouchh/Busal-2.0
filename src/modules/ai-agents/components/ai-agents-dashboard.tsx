import type { AgentDashboardView } from "@/modules/ai-agents/utils/ai-agents-utils";

interface AiAgentsDashboardProps {
  dashboard: AgentDashboardView;
}

export function AiAgentsDashboard({ dashboard }: AiAgentsDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Agents</p>
        <p className="text-2xl font-semibold">{dashboard.totalAgents}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Health</p>
        <p className="text-2xl font-semibold">{(dashboard.healthScore * 100).toFixed(0)}%</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Executions</p>
        <p className="text-2xl font-semibold">{dashboard.totalExecutions}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Success Rate</p>
        <p className="text-2xl font-semibold">{(dashboard.successRate * 100).toFixed(0)}%</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Avg Response</p>
        <p className="text-2xl font-semibold">{dashboard.averageResponseTimeMs}ms</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Costs</p>
        <p className="text-2xl font-semibold">${(dashboard.totalCostCents / 100).toFixed(2)}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Knowledge Usage</p>
        <p className="text-2xl font-semibold">{dashboard.knowledgeUsage}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Tool Usage</p>
        <p className="text-2xl font-semibold">{dashboard.toolUsage}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Automation Usage</p>
        <p className="text-2xl font-semibold">{dashboard.automationUsage}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Published</p>
        <p className="text-2xl font-semibold">{dashboard.publishedAgents}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Paused</p>
        <p className="text-2xl font-semibold">{dashboard.pausedAgents}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Errors</p>
        <p className="text-2xl font-semibold">{dashboard.errors}</p>
      </div>
    </div>
  );
}
