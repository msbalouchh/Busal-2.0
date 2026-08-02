"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { MEDIA_PLATFORM_NAV_ITEMS } from "@/modules/media-platform-management/constants/routes";

export function MediaPlatformNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Media platform" className="flex flex-wrap gap-2">
      {MEDIA_PLATFORM_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
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
