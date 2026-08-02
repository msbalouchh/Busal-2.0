import Link from "next/link";

import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import type { AiPlatformPermissions } from "@/modules/ai-platform/types/ai-platform-types";
import { AiToolsDashboard } from "@/modules/ai-tools/components/ai-tools-dashboard";
import type {
  AiToolExecutionView,
  AiToolsDashboardView,
  AiToolView,
} from "@/modules/ai-tools/utils/ai-tools-utils";
import type { DiscoveredTool } from "@/modules/ai-tools/types/tool-types";

interface AiToolsPanelProps {
  permissions: AiPlatformPermissions;
  dashboard: AiToolsDashboardView;
  tools: AiToolView[];
  executions: AiToolExecutionView[];
  discovered: DiscoveredTool[];
}

export function AiToolsPanel({
  permissions,
  dashboard,
  tools,
  executions,
  discovered,
}: AiToolsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Available tools, permissions, connected services, usage, and execution history.
        </p>
        {permissions.canManageTools ? (
          <Link
            href={AI_PLATFORM_ROUTES.toolsModule}
            className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
          >
            Open Tools registry
          </Link>
        ) : null}
      </div>

      <AiToolsDashboard dashboard={dashboard} recentExecutions={executions.slice(0, 10)} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Registered tools</h2>
          {tools.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tools registered yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {tools.map((tool) => (
                <li key={tool.id} className="flex items-center justify-between gap-3">
                  <span className="font-medium">{tool.name}</span>
                  <span className="text-muted-foreground">{tool.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Connected services</h2>
          {discovered.length === 0 ? (
            <p className="text-muted-foreground text-sm">No discoverable tools available.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {discovered.map((tool) => (
                <li key={tool.toolId}>
                  <span className="font-medium">{tool.name}</span>
                  <span className="text-muted-foreground"> · {tool.module}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Execution history</h2>
        {executions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tool executions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Tool</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Tokens</th>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((execution) => (
                  <tr key={execution.id} className="border-t">
                    <td className="px-4 py-2">{execution.toolId}</td>
                    <td className="px-4 py-2">{execution.status}</td>
                    <td className="px-4 py-2">{execution.tokensUsed ?? "—"}</td>
                    <td className="px-4 py-2">{execution.modelUsed ?? "—"}</td>
                    <td className="px-4 py-2">{new Date(execution.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
