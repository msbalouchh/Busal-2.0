import type {
  AutomationExecutionView,
  AutomationWorkflowView,
} from "@/modules/ai-automation/utils/ai-automation-utils";

interface AiAutomationListsProps {
  workflows?: AutomationWorkflowView[];
  templates?: AutomationWorkflowView[];
  executions?: AutomationExecutionView[];
  approvals?: Array<{
    id: string;
    workflowName: string;
    approvalType: string;
    status: string;
    requestedAt: string;
  }>;
  events?: Array<{
    id: string;
    category: string;
    eventType: string;
    sourceModule: string;
    createdAt: string;
  }>;
  variant: "workflows" | "templates" | "executions" | "approvals" | "events" | "monitoring";
  dashboard?: {
    retries: number;
    totalAiTokens: number;
  };
}

export function AiAutomationLists({
  workflows,
  templates,
  executions,
  approvals,
  events,
  variant,
  dashboard,
}: AiAutomationListsProps) {
  if (variant === "workflows" && workflows) {
    return (
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Workflow</th>
              <th className="px-4 py-3 font-medium">Trigger</th>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((workflow) => (
              <tr key={workflow.id} className="border-t">
                <td className="px-4 py-3 font-medium">{workflow.name}</td>
                <td className="px-4 py-3">{workflow.triggerType ?? "—"}</td>
                <td className="px-4 py-3">v{workflow.versionNumber ?? "—"}</td>
                <td className="px-4 py-3">{workflow.status ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === "templates" && templates) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((template) => (
          <div key={template.id} className="bg-card rounded-xl border p-4 shadow-sm">
            <h3 className="font-medium">{template.name}</h3>
            <p className="text-muted-foreground mt-2 text-sm">{template.description}</p>
            <p className="text-muted-foreground mt-3 text-xs">
              {template.triggerType} · {template.status}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "executions" && executions) {
    return (
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Workflow</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">AI Decisions</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((execution) => (
              <tr key={execution.id} className="border-t">
                <td className="px-4 py-3">{execution.workflowName}</td>
                <td className="px-4 py-3">{execution.status}</td>
                <td className="px-4 py-3">
                  {execution.durationMs != null ? `${execution.durationMs}ms` : "—"}
                </td>
                <td className="px-4 py-3">{execution.aiDecisionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === "approvals" && approvals) {
    return (
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Workflow</th>
              <th className="px-4 py-3 font-medium">Approval</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Requested</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((approval) => (
              <tr key={approval.id} className="border-t">
                <td className="px-4 py-3">{approval.workflowName}</td>
                <td className="px-4 py-3">{approval.approvalType}</td>
                <td className="px-4 py-3">{approval.status}</td>
                <td className="px-4 py-3">{new Date(approval.requestedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === "events" && events) {
    return (
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Module</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="px-4 py-3">{event.eventType}</td>
                <td className="px-4 py-3">{event.category}</td>
                <td className="px-4 py-3">{event.sourceModule}</td>
                <td className="px-4 py-3">{new Date(event.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === "monitoring" && executions && dashboard) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Retries: {dashboard.retries} · AI tokens: {dashboard.totalAiTokens}
        </p>
        <AiAutomationLists variant="executions" executions={executions} />
      </div>
    );
  }

  return null;
}
