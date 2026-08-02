"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";

const NAV_ITEMS = [
  { href: AI_RESTAURANT_ASSISTANT_ROUTES.dashboard(), label: "Dashboard" },
  { href: AI_RESTAURANT_ASSISTANT_ROUTES.chat(), label: "Chat" },
  { href: AI_RESTAURANT_ASSISTANT_ROUTES.insights(), label: "Insights" },
  { href: AI_RESTAURANT_ASSISTANT_ROUTES.recommendations(), label: "Recommendations" },
] as const;

export function AssistantNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-3">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
