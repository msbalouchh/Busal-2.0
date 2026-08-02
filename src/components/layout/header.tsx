"use client";

import { SidebarTrigger } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { BranchSwitcher } from "@/modules/business-context/components/branch-switcher";
import { BusinessSwitcher } from "@/modules/business-context/components/business-switcher";
import { AiAssistantButton } from "@/modules/dashboard/components/header/ai-assistant-button";
import {
  DashboardBreadcrumb,
  DashboardPageTitle,
} from "@/modules/dashboard/components/header/dashboard-breadcrumb";
import {
  GlobalSearchTrigger,
  QuickActionsMenu,
} from "@/modules/dashboard/components/header/global-search-trigger";
import { LanguageSelector } from "@/modules/dashboard/components/header/language-selector";
import { NotificationCenterTrigger } from "@/modules/dashboard/components/header/notification-center-trigger";
import { ProfileMenu } from "@/modules/dashboard/components/header/profile-menu";

interface HeaderProps {
  greeting: string;
  userEmail: string;
}

export function Header({ greeting, userEmail }: HeaderProps) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex min-h-14 flex-wrap items-center gap-3 px-4 py-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <BusinessSwitcher />
            <BranchSwitcher />
          </div>
          <DashboardPageTitle />
          <DashboardBreadcrumb />
          <p className="text-muted-foreground truncate text-xs">{greeting}</p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
          <GlobalSearchTrigger />
          <QuickActionsMenu />
          <AiAssistantButton />
          <NotificationCenterTrigger />
          <LanguageSelector />
          <ThemeToggle />
          <ProfileMenu userEmail={userEmail} />
        </div>
      </div>
    </header>
  );
}
