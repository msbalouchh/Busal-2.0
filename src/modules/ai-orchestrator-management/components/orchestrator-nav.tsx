"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ORCHESTRATOR_NAV_ITEMS } from "@/modules/ai-orchestrator-management/constants/routes";
import { cn } from "@/lib/utils";

export function OrchestratorNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="AI orchestrator navigation">
      {ORCHESTRATOR_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
