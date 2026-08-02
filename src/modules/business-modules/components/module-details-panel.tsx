"use client";

import { Boxes, Loader2, Power, PowerOff } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { Grid } from "@/components/common/grid";
import { Section } from "@/components/common/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  disableBusinessModuleAction,
  enableBusinessModuleAction,
} from "@/modules/business-modules/actions/business-module-actions";
import { resolveIndustryModuleIcon } from "@/modules/business-modules/constants/module-icons";
import { ModuleStatusBadge } from "@/modules/business-modules/components/module-status-badge";
import { BUSINESS_MODULE_ROUTES } from "@/modules/business-modules/constants/routes";
import type { BusinessModuleDetailsContext } from "@/modules/business-modules/lib/get-business-modules-context";

interface ModuleDetailsPanelProps {
  context: Pick<
    BusinessModuleDetailsContext,
    "definition" | "installation" | "permissionsFlags" | "moduleKey"
  >;
}

export function ModuleDetailsPanel({ context }: ModuleDetailsPanelProps) {
  const { definition, installation, permissionsFlags, moduleKey } = context;
  const [isPending, startTransition] = useTransition();
  const Icon = resolveIndustryModuleIcon(definition.iconKey);
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

  return (
    <div className="space-y-8">
      <Card className={cn("rounded-xl shadow-sm", motion.fadeInUp)}>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-xl">
                <Icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-2xl tracking-tight">
                    {definition.displayName}
                  </CardTitle>
                  <Badge variant="secondary">{definition.category}</Badge>
                  {installation ? (
                    <ModuleStatusBadge
                      status={installation.status}
                      isEnabled={installation.isEnabled}
                    />
                  ) : (
                    <Badge variant="outline">Not installed</Badge>
                  )}
                </div>
                <CardDescription className="max-w-2xl text-base leading-relaxed">
                  {definition.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!installation && permissionsFlags.canEnable ? (
                <Button
                  type="button"
                  disabled={isPending}
                  aria-label={`Enable ${definition.displayName}`}
                  onClick={() =>
                    runAction(
                      () => enableBusinessModuleAction(moduleKey),
                      `${definition.displayName} enabled`,
                    )
                  }
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                  Enable module
                </Button>
              ) : null}
              {installation && !isEnabled && permissionsFlags.canEnable ? (
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      () => enableBusinessModuleAction(moduleKey),
                      `${definition.displayName} enabled`,
                    )
                  }
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                  Enable
                </Button>
              ) : null}
              {installation && isEnabled && permissionsFlags.canDisable ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      () => disableBusinessModuleAction(moduleKey),
                      `${definition.displayName} disabled`,
                    )
                  }
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PowerOff className="h-4 w-4" />
                  )}
                  Disable
                </Button>
              ) : null}
              <Button asChild variant="ghost">
                <Link href={BUSINESS_MODULE_ROUTES.dashboard}>Back to modules</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Version</p>
            <p className="mt-1 font-semibold">{definition.version}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Module key</p>
            <p className="mt-1 font-semibold">{definition.moduleKey}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Dashboard route</p>
            <p className="mt-1 font-semibold">{definition.routes.dashboard}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Installed</p>
            <p className="mt-1 font-semibold">
              {installation?.installedAt
                ? new Date(installation.installedAt).toLocaleString("en-GB")
                : "Not installed"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Section
        title="Future capabilities"
        description="Planned features for this industry module. Functionality will ship in future releases."
      >
        <Grid columns="auto-fit" className="grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
          {definition.futureCapabilities.map((capability) => (
            <Card key={capability} className="rounded-xl shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                  <CardTitle className="text-sm">{capability}</CardTitle>
                </div>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section title="Permissions" description="Permission codes associated with this module.">
        <div className="flex flex-wrap gap-2">
          {definition.permissions.map((permission) => (
            <Badge key={permission} variant="outline" className="font-mono text-xs">
              {permission}
            </Badge>
          ))}
        </div>
      </Section>
    </div>
  );
}
