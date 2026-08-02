"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useControlCenterContext } from "@/modules/control-center/components/control-center-provider";
import { CONTROL_CENTER_QUICK_ACTIONS } from "@/modules/control-center/constants/navigation-items";
import { filterControlCenterQuickActions } from "@/modules/control-center/lib/filter-control-center-navigation";

export function ControlCenterQuickActionsMenu() {
  const { permissions, featureFlags } = useControlCenterContext();

  const actions = useMemo(
    () => filterControlCenterQuickActions(CONTROL_CENTER_QUICK_ACTIONS, permissions, featureFlags),
    [featureFlags, permissions],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Quick actions">
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.length === 0 ? (
          <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
        ) : (
          actions.map((action) => (
            <DropdownMenuItem key={action.id} asChild>
              <Link href={action.href}>{action.label}</Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
