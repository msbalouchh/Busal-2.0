"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PremiumEmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  href?: string;
  className?: string;
}

export function PremiumEmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  href,
  className,
}: PremiumEmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        "bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center shadow-sm",
        motion.cardHover,
        className,
      )}
    >
      <div className="from-primary/10 to-muted mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br">
        <Icon className="text-primary h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">{description}</p>
      {href ? (
        <Button asChild variant="outline" size="sm" className={cn("mt-6", motion.buttonPress)}>
          <Link href={href}>{actionLabel}</Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-disabled="true"
          className={cn("mt-6", motion.buttonPress)}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
