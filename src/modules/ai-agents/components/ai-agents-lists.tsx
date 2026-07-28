import type {
  AgentDelegationView,
  AgentExecutionView,
  AgentMemoryView,
  AgentView,
} from "@/modules/ai-agents/utils/ai-agents-utils";

interface AiAgentsListsProps {
  agents?: AgentView[];
  executions?: AgentExecutionView[];
  delegations?: AgentDelegationView[];
  memories?: AgentMemoryView[];
  skills?: Array<{
    skillId: string;
    name: string;
    description: string;
    department: string;
    allowedTools: string[];
    allowedWorkflows: string[];
  }>;
}

export function AiAgentsLists({
  agents = [],
  executions = [],
  delegations = [],
  memories = [],
  skills = [],
}: AiAgentsListsProps) {
  return (
    <div className="space-y-8">
      {agents.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Agents</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Agent ID</th>
                  <th className="px-4 py-2 text-left">Department</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Version</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-t">
                    <td className="px-4 py-2">{agent.name}</td>
                    <td className="px-4 py-2">{agent.agentId}</td>
                    <td className="px-4 py-2">{agent.department ?? "—"}</td>
                    <td className="px-4 py-2">{agent.status}</td>
                    <td className="px-4 py-2">{agent.versionNumber ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {skills.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Skills</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => (
              <div key={skill.skillId} className="bg-card rounded-xl border p-4 shadow-sm">
                <p className="font-medium">{skill.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">{skill.description}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  Tools: {skill.allowedTools.join(", ") || "None"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {executions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Executions</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Agent</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Trigger</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Cost</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((execution) => (
                  <tr key={execution.id} className="border-t">
                    <td className="px-4 py-2">{execution.agentName}</td>
                    <td className="px-4 py-2">{execution.status}</td>
                    <td className="px-4 py-2">{execution.triggerType ?? "—"}</td>
                    <td className="px-4 py-2">{execution.durationMs ?? "—"}ms</td>
                    <td className="px-4 py-2">${(execution.costCents / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {delegations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Delegations</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">From</th>
                  <th className="px-4 py-2 text-left">To</th>
                  <th className="px-4 py-2 text-left">Task</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {delegations.map((delegation) => (
                  <tr key={delegation.id} className="border-t">
                    <td className="px-4 py-2">{delegation.fromAgentName}</td>
                    <td className="px-4 py-2">{delegation.toAgentName}</td>
                    <td className="px-4 py-2">{delegation.taskSummary}</td>
                    <td className="px-4 py-2">{delegation.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {memories.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Memory</h2>
          <div className="space-y-2">
            {memories.map((memory) => (
              <div key={memory.id} className="bg-card rounded-xl border p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{memory.agentName}</p>
                  <span className="text-muted-foreground text-xs">{memory.memoryType}</span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{memory.contentPreview}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
