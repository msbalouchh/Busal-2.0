"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createWorkflowFromTemplateAction } from "@/modules/automation-platform-management/actions/automation-platform-actions";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";
import type { AutomationPlatformContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import type { AutomationTemplateRecord } from "@/modules/automation-platform-management/types/automation-platform-types";

interface AutomationTemplatesPanelProps {
  context: AutomationPlatformContext;
  templates: AutomationTemplateRecord[];
}

export function AutomationTemplatesPanel({ context, templates }: AutomationTemplatesPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <AutomationPlatformNav />
      <p className="text-muted-foreground text-sm">
        Pre-built workflow templates for common business processes.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="text-base">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{template.triggerType}</Badge>
                <Badge variant="secondary">{template.triggerEvent}</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Actions: {template.actions.join(", ")}
              </p>
              {context.permissionsFlags.canCreate ? (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await createWorkflowFromTemplateAction(template.id);
                      window.location.href = AUTOMATION_PLATFORM_ROUTES.workflowDetail(result.id);
                    })
                  }
                >
                  Use template
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Link
        href={AUTOMATION_PLATFORM_ROUTES.workflows()}
        className="text-primary text-sm hover:underline"
      >
        View all workflows
      </Link>
    </div>
  );
}
