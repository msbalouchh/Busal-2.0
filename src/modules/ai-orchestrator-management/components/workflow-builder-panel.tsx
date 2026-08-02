"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWorkflowTemplateAction } from "@/modules/ai-orchestrator-management/actions/ai-orchestrator-actions";
import { OrchestratorNav } from "@/modules/ai-orchestrator-management/components/orchestrator-nav";
import type { AiOrchestratorContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";
import type { WorkflowTemplate } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

interface WorkflowBuilderPanelProps {
  context: AiOrchestratorContext;
  templates: WorkflowTemplate[];
}

export function WorkflowBuilderPanel({ context, templates }: WorkflowBuilderPanelProps) {
  const [isPending, startTransition] = useTransition();

  const buildTemplate = (templateKey: string) => {
    startTransition(async () => {
      await buildWorkflowTemplateAction(templateKey);
    });
  };

  return (
    <div className="space-y-8">
      <OrchestratorNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Create orchestrator workflows from templates. Steps route to the AI Skills Library
            without embedding business logic in the orchestrator.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <div key={template.key} className="rounded-lg border p-4">
                <p className="font-medium">{template.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">{template.description}</p>
                <ol className="text-muted-foreground mt-3 list-decimal space-y-1 pl-5 text-sm">
                  {template.steps.map((step) => (
                    <li key={step.label}>{step.label}</li>
                  ))}
                </ol>
                {context.permissionsFlags.canCreate ? (
                  <Button
                    className="mt-4"
                    size="sm"
                    disabled={isPending}
                    onClick={() => buildTemplate(template.key)}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Build workflow
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
