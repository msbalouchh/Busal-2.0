"use client";

import { ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { API_ROUTES, ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { assignAppPath } from "@/lib/app-navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SETTINGS_ENGINE_ROUTES } from "@/modules/settings-engine/constants/routes";

interface ProfileMenuProps {
  userEmail: string;
}

export function ProfileMenu({ userEmail }: ProfileMenuProps) {
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
          aria-label="Profile menu"
        >
          <UserCircle className="h-4 w-4" />
          <span className="max-w-[120px] truncate text-xs">{userEmail}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{userEmail}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={SETTINGS_ENGINE_ROUTES.overview}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
