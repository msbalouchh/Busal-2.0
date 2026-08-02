"use client";

import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ApplicationHomeHero } from "@/modules/application-home/types/application-home-types";

interface DashboardHeroProps {
  hero: ApplicationHomeHero;
  healthScore: number;
}

export function DashboardHero({ hero, healthScore }: DashboardHeroProps) {
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-sm",
        "from-primary/10 via-background to-background bg-gradient-to-br",
        motion.cardHover,
      )}
      aria-labelledby="dashboard-hero-title"
    >
      <div
        className="bg-primary/10 absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div className="relative space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            AI-powered workspace
          </Badge>
          <Badge variant="outline">
            <time dateTime={todayIso}>{hero.todayLabel}</time>
          </Badge>
          <Badge variant={healthScore >= 80 ? "default" : "secondary"}>Health {healthScore}%</Badge>
        </div>

        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {hero.greeting}, {hero.ownerName}
          </p>
          <h2
            id="dashboard-hero-title"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {hero.businessName}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
            {hero.summary}
          </p>
        </div>

        <div
          className="bg-muted max-w-md overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={healthScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Business health score"
        >
          <div
            className="bg-primary h-2 rounded-full motion-safe:transition-all motion-safe:duration-500"
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>
    </section>
  );
}
