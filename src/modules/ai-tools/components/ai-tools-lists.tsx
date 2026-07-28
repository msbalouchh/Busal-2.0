import { AI_TOOL_CATEGORY_LABELS } from "@/modules/ai-tools/constants/categories";
import type { AiToolView } from "@/modules/ai-tools/utils/ai-tools-utils";
import { getRiskLabel } from "@/modules/ai-tools/engine/tool-safety";
import type { AiToolRiskLevel } from "@prisma/client";

interface AiToolsListsProps {
  tools?: AiToolView[];
  discovered?: Array<{
    toolId: string;
    name: string;
    description: string;
    module: string;
    category: keyof typeof AI_TOOL_CATEGORY_LABELS;
    version: string;
    riskLevel: AiToolRiskLevel;
    readOnly: boolean;
    confirmationRequired: boolean;
    dryRunSupported: boolean;
  }>;
  executions?: Array<{
    id: string;
    toolId: string;
    status: string;
    dryRun: boolean;
    executionTimeMs: number | null;
    errorDetails: string | null;
    createdAt: string;
  }>;
  variant: "registry" | "discovery" | "executions";
}

export function AiToolsLists({ tools, discovered, executions, variant }: AiToolsListsProps) {
  if (variant === "registry" && tools) {
    return (
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Tool</th>
              <th className="px-4 py-3 font-medium">Module</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={tool.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-muted-foreground text-xs">{tool.toolId}</div>
                </td>
                <td className="px-4 py-3">{tool.module}</td>
                <td className="px-4 py-3">
                  {AI_TOOL_CATEGORY_LABELS[tool.category as keyof typeof AI_TOOL_CATEGORY_LABELS] ??
                    tool.category}
                </td>
                <td className="px-4 py-3">{getRiskLabel(tool.riskLevel as AiToolRiskLevel)}</td>
                <td className="px-4 py-3">{tool.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === "discovery" && discovered) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {discovered.map((tool) => (
          <div key={tool.toolId} className="bg-card rounded-xl border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{tool.name}</h3>
                <p className="text-muted-foreground mt-1 text-xs">{tool.toolId}</p>
              </div>
              <span className="text-muted-foreground text-xs">{tool.module}</span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{tool.description}</p>
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs">
              <span>{AI_TOOL_CATEGORY_LABELS[tool.category]}</span>
              <span>{getRiskLabel(tool.riskLevel)}</span>
              {tool.readOnly ? <span>Read only</span> : null}
              {tool.confirmationRequired ? <span>Confirmation required</span> : null}
            </div>
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
              <th className="px-4 py-3 font-medium">Tool</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Dry Run</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((execution) => (
              <tr key={execution.id} className="border-t">
                <td className="px-4 py-3">{execution.toolId}</td>
                <td className="px-4 py-3">{execution.status}</td>
                <td className="px-4 py-3">{execution.dryRun ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  {execution.executionTimeMs != null ? `${execution.executionTimeMs}ms` : "—"}
                </td>
                <td className="px-4 py-3">{new Date(execution.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
