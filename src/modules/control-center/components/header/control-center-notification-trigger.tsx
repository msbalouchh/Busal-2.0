"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useControlCenterContext } from "@/modules/control-center/components/control-center-provider";
import { CONTROL_CENTER_ROUTES } from "@/modules/control-center/constants/routes";

export function ControlCenterNotificationTrigger() {
  const { openAlerts = 0 } = useControlCenterContext();

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={
        openAlerts > 0 ? `Platform alerts, ${openAlerts} open` : "Platform alerts, no open alerts"
      }
    >
      <Link href={CONTROL_CENTER_ROUTES.monitoring}>
        <Bell className="h-4 w-4" />
        {openAlerts > 0 ? (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
          >
            {openAlerts > 99 ? "99+" : openAlerts}
          </Badge>
        ) : null}
      </Link>
    </Button>
  );
}
