"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/modules/dashboard/components/section-header";
import type { DashboardActivityItem } from "@/modules/dashboard/types/dashboard";

interface DashboardActivityFeedProps {
  items: DashboardActivityItem[];
  viewAllHref?: string;
  className?: string;
}

function formatActivityTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function DashboardActivityFeed({
  items,
  viewAllHref,
  className,
}: DashboardActivityFeedProps) {
  return (
    <Card className={cn("rounded-xl shadow-sm", motion.cardHover, className)}>
      <CardHeader className="pb-4">
        <SectionHeader
          title="Recent activity"
          description="Latest updates across your workspace."
          action={
            viewAllHref ? (
              <Button asChild variant="ghost" size="sm" className={motion.buttonPress}>
                <Link href={viewAllHref}>View all</Link>
              </Button>
            ) : null
          }
        />
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm" role="status">
            No recent activity yet.
          </p>
        ) : (
          <ol className="relative space-y-1" aria-label="Recent activity">
            <span
              className="bg-border absolute top-3 bottom-3 left-[7px] w-px"
              aria-hidden="true"
            />
            {items.map((item) => (
              <li key={item.id}>
                <article
                  className={cn(
                    "relative rounded-lg py-3 pr-2 pl-8",
                    motion.transitionColors,
                    "motion-safe:hover:bg-muted/50",
                  )}
                >
                  <span
                    className="bg-primary ring-background absolute top-5 left-0 h-3.5 w-3.5 rounded-full ring-2"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={cn(
                          "text-sm font-medium hover:underline",
                          motion.transitionColors,
                        )}
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{item.title}</p>
                    )}
                    {item.description ? (
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {item.description}
                      </p>
                    ) : null}
                    <time className="text-muted-foreground text-xs" dateTime={item.timestamp}>
                      {formatActivityTime(item.timestamp)}
                    </time>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
