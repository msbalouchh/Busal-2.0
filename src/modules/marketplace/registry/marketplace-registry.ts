import type { MarketplaceExtensionDefinition } from "@/modules/marketplace/types/marketplace-types";

const extensions = new Map<string, MarketplaceExtensionDefinition>();

export function registerMarketplaceExtension(definition: MarketplaceExtensionDefinition): void {
  extensions.set(definition.slug, definition);
}

export function getMarketplaceExtension(slug: string): MarketplaceExtensionDefinition | undefined {
  return extensions.get(slug);
}

export function listMarketplaceExtensions(): MarketplaceExtensionDefinition[] {
  return Array.from(extensions.values());
}

export function listMarketplaceExtensionsByCategory(
  category: MarketplaceExtensionDefinition["category"],
): MarketplaceExtensionDefinition[] {
  return listMarketplaceExtensions().filter((extension) => extension.category === category);
}
