"use client";

import { usePathname } from "next/navigation";

import { MarketingFooter } from "@/modules/marketing/components/marketing-footer";
import { MarketingHeader } from "@/modules/marketing/components/marketing-header";
import { cn } from "@/lib/utils";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className={cn(
        "marketing-root bg-marketing-surface text-marketing-ink min-h-screen",
        isHome && "marketing-home",
      )}
    >
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <MarketingHeader />
      <main id="main-content">{children}</main>
      <MarketingFooter />
    </div>
  );
}
