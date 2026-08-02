"use client";

import { Boxes, CheckCircle2, Package, Sparkles } from "lucide-react";

import { Grid } from "@/components/common/grid";
import { Section } from "@/components/common/section";
import { resolveIndustryModuleIcon } from "@/modules/business-modules/constants/module-icons";
import { ModuleCard } from "@/modules/business-modules/components/module-card";
import type { BusinessModulesContext } from "@/modules/business-modules/lib/get-business-modules-context";
import { StatCard } from "@/modules/dashboard/components/stat-card";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ModulesDashboardPanelProps {
  context: Pick<BusinessModulesContext, "bundle" | "permissionsFlags">;
}

export function ModulesDashboardPanel({ context }: ModulesDashboardPanelProps) {
  const { bundle, permissionsFlags } = context;

  return (
    <div className="space-y-10">
      <Grid columns={2} className="gap-4 lg:grid-cols-4">
        <StatCard
          title="Total modules"
          value={bundle.totalModules}
          description="Industry modules available in Busal OS"
          icon={Boxes}
          className={cn("rounded-xl shadow-sm", motion.fadeInUp)}
        />
        <StatCard
          title="Installed"
          value={bundle.installedCount}
          description="Modules added to your business"
          icon={Package}
          className={cn(
            "rounded-xl shadow-sm",
            motion.fadeInUp,
            "motion-safe:[animation-delay:50ms]",
          )}
        />
        <StatCard
          title="Enabled"
          value={bundle.enabledCount}
          description="Active modules in your workspace"
          icon={CheckCircle2}
          className={cn(
            "rounded-xl shadow-sm",
            motion.fadeInUp,
            "motion-safe:[animation-delay:100ms]",
          )}
        />
        <StatCard
          title="Available"
          value={bundle.available.length}
          description="Ready to enable for your business"
          icon={Sparkles}
          className={cn(
            "rounded-xl shadow-sm",
            motion.fadeInUp,
            "motion-safe:[animation-delay:150ms]",
          )}
        />
      </Grid>

      <Section
        title="Installed modules"
        description="Industry modules currently installed for your business."
      >
        {bundle.installed.length > 0 ? (
          <Grid columns="auto-fit" className="grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
            {bundle.installed.map((installation) => (
              <ModuleCard
                key={installation.id}
                definition={installation.definition}
                installation={installation}
                icon={resolveIndustryModuleIcon(installation.definition.iconKey)}
                permissions={permissionsFlags}
                variant="installed"
              />
            ))}
          </Grid>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
            No modules installed yet. Enable an industry module below to get started.
          </p>
        )}
      </Section>

      <Section
        title="Available modules"
        description="Industry modules you can enable for your business. Marketplace installation support is planned."
      >
        {bundle.available.length > 0 ? (
          <Grid columns="auto-fit" className="grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
            {bundle.available.map((definition) => (
              <ModuleCard
                key={definition.moduleKey}
                definition={definition}
                icon={resolveIndustryModuleIcon(definition.iconKey)}
                permissions={permissionsFlags}
                variant="available"
              />
            ))}
          </Grid>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
            All registry modules are already installed for this business.
          </p>
        )}
      </Section>
    </div>
  );
}
