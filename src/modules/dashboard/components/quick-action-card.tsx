import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function QuickActionCard({
  label,
  href,
  icon: Icon,
  description,
  className,
}: QuickActionCardProps) {
  return (
    <Button
      asChild
      variant="outline"
      className={cn("h-auto min-h-11 w-full justify-start px-4 py-3 text-left", className)}
    >
      <Link href={href}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex flex-col items-start gap-0.5">
          <span className="font-medium">{label}</span>
          {description ? (
            <span className="text-muted-foreground text-xs font-normal">{description}</span>
          ) : null}
        </span>
      </Link>
    </Button>
  );
}
