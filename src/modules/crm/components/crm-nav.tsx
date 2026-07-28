"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { CRM_NAV_ITEMS } from "@/modules/crm/constants/routes";

export function CrmNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {CRM_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.href || pathname.startsWith(`${item.href}/`)
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
