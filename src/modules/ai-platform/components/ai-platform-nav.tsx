"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { AI_PLATFORM_NAV_ITEMS } from "@/modules/ai-platform/constants/ai-platform";

export function AiPlatformNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="AI platform" className="flex flex-wrap gap-2 border-b pb-4">
      {AI_PLATFORM_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard/ai-platform" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
