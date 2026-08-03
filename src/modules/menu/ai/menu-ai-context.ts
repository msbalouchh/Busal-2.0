import { menuService } from "@/modules/menu/services/menu.service";
import { getPopularItems } from "@/modules/menu/services/menu-platform.service";
import { getMenuItemSummary, sortByPopularity } from "@/modules/menu/utils/menu-selectors";
import type { MenuAiContext, MenuItemRecord } from "@/modules/menu/types/menu";

export function buildMenuItemAiContext(itemId: string): MenuAiContext | null {
  const record = menuService.getItemById(itemId);

  if (!record) {
    return null;
  }

  return {
    ...record.aiContext,
    summary: getMenuItemSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Popularity: ${(record.aiContext.popularityScore * 100).toFixed(0)}%`,
      `Channels: ${record.item.channels.join(", ") || "none"}`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function recommendMenuPricing(itemId: string): Record<string, unknown> | null {
  const record = menuService.getItemById(itemId);

  if (!record) {
    return null;
  }

  const current = record.pricing.basePricePence;
  const recommended = record.aiContext.pricingRecommendationPence ?? current + 75;
  const delta = recommended - current;

  return {
    itemId,
    itemName: record.item.name,
    currentPricePence: current,
    recommendedPricePence: recommended,
    deltaPence: delta,
    rationale:
      delta > 0
        ? "High popularity supports modest price increase"
        : "Price aligned with market — maintain current pricing",
    branchOverrides: record.pricing.branchOverrides,
  };
}

export function recommendMenuUpsells(itemId: string): string[] {
  const record = menuService.getItemById(itemId);

  if (!record) {
    return [];
  }

  const suggestions = [...record.aiContext.upsellSuggestions];

  if (record.item.name.toLowerCase().includes("burger")) {
    suggestions.push("Add truffle fries — 68% attach rate");
  }

  if (record.preparation.prepTimeMinutes < 10) {
    suggestions.push("Pair with premium drink upgrade");
  }

  return suggestions.length > 0 ? suggestions : ["No upsell opportunities identified"];
}

export function analyzePopularMenuItems(limit = 5): Record<string, unknown> {
  const popular = getPopularItems(limit);

  return {
    itemCount: popular.length,
    items: popular.map((record) => ({
      itemId: record.item.id,
      name: record.item.name,
      popularityScore: record.aiContext.popularityScore,
      basePricePence: record.pricing.basePricePence,
      channels: record.item.channels,
    })),
    topPerformer: popular[0]?.item.name ?? null,
  };
}

export function detectDuplicateMenuItems(): Record<string, unknown> {
  const duplicates = menuService.detectDuplicates();

  return {
    duplicateGroups: duplicates.length,
    matches: duplicates,
  };
}

export function searchMenuItemsForAi(query: string): MenuItemRecord[] {
  return menuService.searchItems({ query, limit: 10 });
}

export function buildMenuCatalogSummary(): Record<string, unknown> {
  const items = menuService.searchItems({});
  const ranked = sortByPopularity(items);

  return {
    totalItems: items.length,
    activeItems: items.filter((i) => i.item.status === "active").length,
    topItems: ranked.slice(0, 3).map((r) => r.item.name),
  };
}
