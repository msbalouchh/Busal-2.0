"use client";

import { ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API_ROUTES, ROUTES } from "@/constants/routes";
import { assignAppPath } from "@/lib/app-navigation";
import { CONTROL_CENTER_ROUTES } from "@/modules/control-center/constants/routes";

interface ControlCenterProfileMenuProps {
  operatorEmail: string;
}

export function ControlCenterProfileMenu({ operatorEmail }: ControlCenterProfileMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await fetch(API_ROUTES.logout, {
        method: "POST",
        credentials: "include",
      });
      assignAppPath(ROUTES.login);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="hidden h-9 gap-2 px-3 sm:inline-flex"
          aria-label="Operator profile menu"
        >
          <UserCircle className="h-4 w-4" />
          <span className="max-w-[120px] truncate text-xs">{operatorEmail}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{operatorEmail}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={CONTROL_CENTER_ROUTES.settings}>
            <Settings className="mr-2 h-4 w-4" />
            Platform settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isSigningOut} onSelect={() => void handleSignOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
