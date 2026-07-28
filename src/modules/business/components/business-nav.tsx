"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BUSINESS_NAV_ITEMS } from "@/modules/business/constants/routes";
import { cn } from "@/lib/utils";

export function BusinessNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b pb-4" aria-label="Business management">
      <div className="flex flex-wrap gap-2">
        {BUSINESS_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
