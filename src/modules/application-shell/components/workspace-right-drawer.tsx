"use client";

import { Bot, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkspaceSidePanel } from "@/modules/application-shell/components/workspace-side-panel";
import { useWorkspaceShellContext } from "@/modules/application-shell/providers/workspace-shell-provider";

/** Right drawer shell reserved for AI assistant and contextual tools. */
export function WorkspaceRightDrawer() {
  const { isRightDrawerOpen, closeRightDrawer } = useWorkspaceShellContext();

  return (
    <WorkspaceSidePanel
      open={isRightDrawerOpen}
      onOpenChange={(open) => !open && closeRightDrawer()}
      aria-label="AI assistant"
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-md">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">AI Assistant</h2>
            <p className="text-muted-foreground text-sm">
              Architecture placeholder — no AI runtime wired.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeRightDrawer}
          aria-label="Close AI assistant"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Bot className="text-muted-foreground h-4 w-4" aria-hidden="true" />
              <p className="text-sm font-medium">Future integration point</p>
            </div>
            <p className="text-muted-foreground text-sm">
              This drawer will host the persistent AI copilot, contextual suggestions, and
              module-aware actions. Connect your AI provider and conversation store here.
            </p>
          </div>

          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>• Workspace-aware context injection</li>
            <li>• Module-specific tool routing</li>
            <li>• Conversation history persistence</li>
            <li>• Action confirmation flows</li>
          </ul>
        </div>
      </ScrollArea>
    </WorkspaceSidePanel>
  );
}
