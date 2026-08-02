"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { RESTAURANT_OPERATIONS_NAV_ITEMS } from "@/modules/restaurant-operations/constants/restaurant-operations";

export function RestaurantNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Restaurant operations" className="flex flex-wrap gap-2 border-b pb-4">
      {RESTAURANT_OPERATIONS_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard/restaurant" && pathname.startsWith(item.href));

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
