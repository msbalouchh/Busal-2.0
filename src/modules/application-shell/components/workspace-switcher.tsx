"use client";

import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useWorkspaceShellContext } from "@/modules/application-shell/providers/workspace-shell-provider";

interface WorkspaceSwitcherProps {
  className?: string;
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const { workspaceName, workspaces, activeWorkspaceId, switchWorkspace } =
    useWorkspaceShellContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "hidden h-9 max-w-[12rem] justify-between gap-2 px-2 md:inline-flex",
            className,
            motion.buttonPress,
          )}
          aria-label="Switch workspace"
        >
          <span className="truncate text-sm font-medium">{workspaceName}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            className="flex items-center justify-between gap-2"
            onSelect={() => switchWorkspace(workspace.id)}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{workspace.name}</span>
              <span className="text-muted-foreground block truncate text-xs">{workspace.role}</span>
            </span>
            {workspace.id === activeWorkspaceId ? (
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
