"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { COMMERCIAL_PLATFORM_NAV_ITEMS } from "@/modules/commercial-platform/constants/commercial-platform";

export function CommercialPlatformNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Commercial platform" className="flex flex-wrap gap-2 border-b pb-4">
      {COMMERCIAL_PLATFORM_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard/commercial-platform" && pathname.startsWith(item.href));

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
