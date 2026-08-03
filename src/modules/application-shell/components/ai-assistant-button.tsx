"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useWorkspaceShellContext } from "@/modules/application-shell/providers/workspace-shell-provider";

interface AiAssistantButtonProps {
  className?: string;
}

/** Persistent AI entry point — architecture only, no AI runtime wired. */
export function AiAssistantButton({ className }: AiAssistantButtonProps) {
  const { openRightDrawer } = useWorkspaceShellContext();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("hidden gap-2 sm:inline-flex", className, motion.buttonPress)}
      aria-label="Open AI assistant"
      onClick={openRightDrawer}
    >
      <Sparkles className="h-4 w-4" aria-hidden="true" />
      AI Assistant
    </Button>
  );
}
