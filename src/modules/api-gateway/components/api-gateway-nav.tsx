"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { API_GATEWAY_NAV_ITEMS } from "@/modules/api-gateway/constants/routes";
import { cn } from "@/lib/utils";

export function ApiGatewayNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {API_GATEWAY_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
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
