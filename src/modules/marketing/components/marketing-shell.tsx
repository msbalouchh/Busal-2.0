"use client";

import { MarketingFooter } from "@/modules/marketing/components/marketing-footer";
import { MarketingHeader } from "@/modules/marketing/components/marketing-header";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-root marketing-home bg-marketing-surface text-marketing-ink min-h-screen">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <MarketingHeader />
      <main id="main-content">{children}</main>
      <MarketingFooter />
    </div>
  );
}
