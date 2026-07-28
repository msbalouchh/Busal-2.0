"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AI_AGENTS_NAV_ITEMS } from "@/modules/ai-agents/constants/routes";
import { cn } from "@/lib/utils";

export function AiAgentsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {AI_AGENTS_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm transition-colors",
            pathname === item.href
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
