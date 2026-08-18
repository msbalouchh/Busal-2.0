"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, Monitor, Moon, Settings, Sun, UserCircle } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API_ROUTES, ROUTES } from "@/constants/routes";
import { assignAppPath } from "@/lib/app-navigation";
import { performClientLogout } from "@/modules/auth/lib/client-logout";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { BUSINESS_ROUTES } from "@/modules/business/constants/routes";

interface UserMenuProps {
  userName?: string;
  userEmail?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

export function UserMenu({ userName, userEmail }: UserMenuProps) {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = userName?.trim() || "Account";
  const displayEmail = userEmail?.trim() || "";
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const currentTheme = theme ?? "system";

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await fetch(API_ROUTES.logout, {
        method: "POST",
        credentials: "include",
      });
      useAuthStore.getState().reset();
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
          className={cn("hidden h-9 gap-2 px-2 sm:inline-flex", motion.buttonPress)}
          aria-label="User menu"
        >
          <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold">
            {initials}
          </span>
          <span className="hidden max-w-[7rem] truncate text-xs md:inline">{displayName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{displayName}</span>
            {displayEmail ? (
              <span className="text-muted-foreground truncate text-xs">{displayEmail}</span>
            ) : null}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={BUSINESS_ROUTES.profile} className="gap-2">
            <UserCircle className="h-4 w-4" />
            View profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={APPLICATION_SHELL_ROUTES.settings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        {mounted ? (
          <DropdownMenuRadioGroup value={currentTheme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        ) : (
          <DropdownMenuItem disabled>Loading theme...</DropdownMenuItem>
        )}

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
