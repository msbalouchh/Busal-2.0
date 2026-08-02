import Link from "next/link";

import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import type { AiPlatformPermissions } from "@/modules/ai-platform/types/ai-platform-types";
import { AiAutomationDashboard } from "@/modules/ai-automation/components/ai-automation-dashboard";
import { AiAutomationLists } from "@/modules/ai-automation/components/ai-automation-lists";
import type {
  AutomationDashboardView,
  AutomationExecutionView,
  AutomationWorkflowView,
} from "@/modules/ai-automation/utils/ai-automation-utils";

interface AiAutomationPanelProps {
  permissions: AiPlatformPermissions;
  dashboard: AutomationDashboardView;
  workflows: AutomationWorkflowView[];
  executions: AutomationExecutionView[];
}

export function AiAutomationPanel({
  permissions,
  dashboard,
  workflows,
  executions,
}: AiAutomationPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Workflow list, triggers, schedules, execution status, and automation history.
        </p>
        {permissions.canManageAutomation ? (
          <Link
            href={AI_PLATFORM_ROUTES.automationModule}
            className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
          >
            Open Automation builder
          </Link>
        ) : null}
      </div>

      <AiAutomationDashboard dashboard={dashboard} />
      <AiAutomationLists variant="workflows" workflows={workflows} />
      <AiAutomationLists variant="executions" executions={executions} dashboard={dashboard} />
    </div>
  );
}
