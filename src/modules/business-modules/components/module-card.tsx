"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  disableBusinessModuleAction,
  enableBusinessModuleAction,
  installBusinessModuleAction,
} from "@/modules/business-modules/actions/business-module-actions";
import { BUSINESS_MODULE_ROUTES } from "@/modules/business-modules/constants/routes";
import { ModuleStatusBadge } from "@/modules/business-modules/components/module-status-badge";
import type { BusinessModulePermissions } from "@/modules/business-modules/lib/get-business-modules-context";
import type { BusinessModuleRecord } from "@/services/business-module.service";
import type { SerializedIndustryModuleDefinition } from "@/modules/business-modules/types/business-module-types";

interface ModuleCardProps {
  definition: SerializedIndustryModuleDefinition;
  installation?: BusinessModuleRecord | null;
  icon: LucideIcon;
  permissions: BusinessModulePermissions;
  variant: "installed" | "available";
}

export function ModuleCard({
  definition,
  installation,
  icon: Icon,
  permissions,
  variant,
}: ModuleCardProps) {
  const [isPending, startTransition] = useTransition();
  const isInstalled = Boolean(installation);
  const isEnabled = installation?.isEnabled ?? false;

  const runAction = (action: () => Promise<{ success: true }>, successMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update module");
      }
    });
  };

  const handlePrimaryAction = () => {
    if (variant === "available") {
      runAction(
        () => enableBusinessModuleAction(definition.moduleKey),
        `${definition.displayName} enabled`,
      );
      return;
    }

    if (isEnabled) {
      if (!permissions.canDisable) {
        return;
      }

      runAction(
        () => disableBusinessModuleAction(definition.moduleKey),
        `${definition.displayName} disabled`,
      );
      return;
    }

    if (!permissions.canEnable) {
      return;
    }

    runAction(
      () => enableBusinessModuleAction(definition.moduleKey),
      `${definition.displayName} enabled`,
    );
  };

  const handleInstall = () => {
    runAction(
      () => installBusinessModuleAction(definition.moduleKey),
      `${definition.displayName} installed`,
    );
  };

  const primaryLabel = variant === "available" ? "Enable module" : isEnabled ? "Disable" : "Enable";
  const canPrimary =
    variant === "available"
      ? permissions.canEnable
      : isEnabled
        ? permissions.canDisable
        : permissions.canEnable;

  return (
    <Card
      className={cn("group rounded-xl shadow-sm", motion.cardInteractive)}
      aria-label={`${definition.displayName} module`}
    >
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "bg-muted flex h-11 w-11 items-center justify-center rounded-lg",
              "motion-safe:transition-colors motion-safe:duration-200",
              "group-hover:bg-primary/10",
            )}
          >
            <Icon className="text-foreground h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {definition.category}
            </Badge>
            {installation ? (
              <ModuleStatusBadge status={installation.status} isEnabled={installation.isEnabled} />
            ) : (
              <Badge variant="outline" className="font-normal">
                Available
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-base tracking-tight">{definition.displayName}</CardTitle>
          <CardDescription className="leading-relaxed">{definition.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-xs">Version {definition.version}</p>
        <div className="flex flex-wrap gap-2">
          {canPrimary ? (
            <Button
              type="button"
              size="sm"
              variant={isEnabled ? "outline" : "default"}
              disabled={isPending}
              aria-label={`${primaryLabel} ${definition.displayName}`}
              onClick={handlePrimaryAction}
              className={motion.buttonPress}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {primaryLabel}
            </Button>
          ) : null}
          {variant === "available" && permissions.canInstall ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              aria-label={`Install ${definition.displayName}`}
              onClick={handleInstall}
            >
              Install only
            </Button>
          ) : null}
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="gap-1"
            aria-label={`View ${definition.displayName} details`}
          >
            <Link href={BUSINESS_MODULE_ROUTES.details(definition.moduleKey)}>
              Details
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {isInstalled ? (
          <p className="text-muted-foreground text-xs">
            Installed{" "}
            {installation?.installedAt
              ? new Date(installation.installedAt).toLocaleDateString("en-GB")
              : "recently"}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
