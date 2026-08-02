import type { ReactNode } from "react";

import { MarketplacePlatformNav } from "@/modules/marketplace-platform/components/marketplace-platform-nav";

interface MarketplacePlatformLayoutProps {
  children: ReactNode;
}

export default function MarketplacePlatformLayout({ children }: MarketplacePlatformLayoutProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <MarketplacePlatformNav />
      {children}
    </div>
  );
}
