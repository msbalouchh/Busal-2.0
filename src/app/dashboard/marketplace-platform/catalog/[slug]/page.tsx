import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketplaceProductPanel } from "@/modules/marketplace-platform/components/marketplace-product-panel";
import { getMarketplacePlatformProductContext } from "@/modules/marketplace-platform/lib/get-marketplace-platform-context";

export const metadata: Metadata = {
  title: "Marketplace Product",
};

interface MarketplaceProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MarketplaceProductPage({ params }: MarketplaceProductPageProps) {
  const { slug } = await params;
  const { product, permissions } = await getMarketplacePlatformProductContext(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-muted-foreground text-sm">Product details, reviews, and installation.</p>
      </div>
      <MarketplaceProductPanel product={product} permissions={permissions} />
    </div>
  );
}
