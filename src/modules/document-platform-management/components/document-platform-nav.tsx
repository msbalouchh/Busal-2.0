"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { DOCUMENT_PLATFORM_NAV_ITEMS } from "@/modules/document-platform-management/constants/routes";

export function DocumentPlatformNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4">
      {DOCUMENT_PLATFORM_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
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
