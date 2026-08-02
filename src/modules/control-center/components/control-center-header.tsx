"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ControlCenterBreadcrumb,
  ControlCenterPageTitle,
} from "@/modules/control-center/components/header/control-center-breadcrumb";
import { ControlCenterGlobalSearch as GlobalSearchTrigger } from "@/modules/control-center/components/header/control-center-global-search";
import { ControlCenterNotificationTrigger as NotificationCenterTrigger } from "@/modules/control-center/components/header/control-center-notification-trigger";
import { ControlCenterProfileMenu as ProfileMenu } from "@/modules/control-center/components/header/control-center-profile-menu";
import { ControlCenterQuickActionsMenu } from "@/modules/control-center/components/header/control-center-quick-actions-menu";
import { ControlCenterSidebarTrigger } from "@/modules/control-center/components/control-center-sidebar";
import { useControlCenterContext } from "@/modules/control-center/components/control-center-provider";
import { LanguageSelector } from "@/modules/dashboard/components/header/language-selector";

interface ControlCenterHeaderProps {
  operatorName: string;
  operatorEmail: string;
}

function PlatformStatusBadge() {
  const { openAlerts = 0 } = useControlCenterContext();
  const isDegraded = openAlerts > 0;

  return (
    <Badge variant="outline" className="hidden h-7 gap-1.5 sm:inline-flex">
      <span
        className={`h-2 w-2 rounded-full ${isDegraded ? "bg-amber-500" : "bg-primary"}`}
        aria-hidden="true"
      />
      {isDegraded ? "Degraded" : "Operational"}
    </Badge>
  );
}

function EnvironmentIndicator({ environment }: { environment: string }) {
  const variant =
    environment === "production"
      ? "destructive"
      : environment === "staging"
        ? "secondary"
        : "outline";

  return (
    <Badge variant={variant} className="hidden h-7 uppercase md:inline-flex">
      {environment}
    </Badge>
  );
}

export function ControlCenterHeader({ operatorName, operatorEmail }: ControlCenterHeaderProps) {
  const { environment } = useControlCenterContext();

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex min-h-14 flex-wrap items-center gap-3 px-4 py-3">
        <ControlCenterSidebarTrigger />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformStatusBadge />
            <EnvironmentIndicator environment={environment} />
          </div>
          <ControlCenterPageTitle />
          <ControlCenterBreadcrumb />
          <p className="text-muted-foreground truncate text-xs">Signed in as {operatorName}</p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
          <GlobalSearchTrigger />
          <ControlCenterQuickActionsMenu />
          <NotificationCenterTrigger />
          <LanguageSelector />
          <ThemeToggle />
          <ProfileMenu operatorEmail={operatorEmail} />
        </div>
      </div>
    </header>
  );
}
