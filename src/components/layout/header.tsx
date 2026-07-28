"use client";

import { Bell, ChevronDown, Search, UserCircle } from "lucide-react";

import { SidebarTrigger } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BranchSwitcher } from "@/modules/business-context/components/branch-switcher";
import { BusinessSwitcher } from "@/modules/business-context/components/business-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface HeaderProps {
  greeting: string;
  userEmail: string;
}

export function Header({ greeting, userEmail }: HeaderProps) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-auto min-h-14 flex-wrap items-center gap-3 border-b px-4 py-3 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      <div className="min-w-0 flex-1 space-y-0.5">
        <BusinessSwitcher />
        <BranchSwitcher />
        <p className="text-muted-foreground truncate text-xs">{greeting}</p>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="relative hidden max-w-xs flex-1 md:block">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search..."
            disabled
            readOnly
            className="bg-muted/40 h-9 pl-9"
            aria-label="Search placeholder"
          />
        </div>

        <Button variant="ghost" size="icon" disabled aria-label="Notifications placeholder">
          <Bell className="h-4 w-4" />
        </Button>

        <ThemeToggle />

        <Button
          type="button"
          variant="outline"
          disabled
          className="hidden h-9 gap-2 px-3 sm:inline-flex"
          aria-label="Profile menu placeholder"
        >
          <UserCircle className="h-4 w-4" />
          <span className="max-w-[120px] truncate text-xs">{userEmail}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </div>
    </header>
  );
}
