import type { Metadata } from "next";

import { MarketplaceNav } from "@/modules/marketplace/components/marketplace-nav";

export const metadata: Metadata = {
  title: "Marketplace",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground text-sm">
          Discover, install, and manage extensions that expand Busal OS.
        </p>
      </div>
      <MarketplaceNav />
      {children}
    </div>
  );
}
