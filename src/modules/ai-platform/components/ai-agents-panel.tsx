import Link from "next/link";

import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import type { AiPlatformPermissions } from "@/modules/ai-platform/types/ai-platform-types";
import { AiAgentsDashboard } from "@/modules/ai-agents/components/ai-agents-dashboard";
import { AiAgentsLists } from "@/modules/ai-agents/components/ai-agents-lists";
import type {
  AgentDashboardView,
  AgentExecutionView,
  AgentView,
} from "@/modules/ai-agents/utils/ai-agents-utils";

interface AiAgentsPanelProps {
  permissions: AiPlatformPermissions;
  dashboard: AgentDashboardView;
  agents: AgentView[];
  executions: AgentExecutionView[];
}

export function AiAgentsPanel({ permissions, dashboard, agents, executions }: AiAgentsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Agent directory, status, permissions, and activity across your business.
        </p>
        {permissions.canManageAgents ? (
          <Link
            href={AI_PLATFORM_ROUTES.agentsModule}
            className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
          >
            Manage in Agents module
          </Link>
        ) : null}
      </div>

      <AiAgentsDashboard dashboard={dashboard} />
      <AiAgentsLists agents={agents} executions={executions} />
    </div>
  );
}
