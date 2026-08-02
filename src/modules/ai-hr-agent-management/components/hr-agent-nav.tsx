"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { HR_AGENT_NAV_ITEMS } from "@/modules/ai-hr-agent-management/constants/routes";

export function HrAgentNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="HR agent navigation" className="flex flex-wrap gap-2">
      {HR_AGENT_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/app/ai/hr" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
