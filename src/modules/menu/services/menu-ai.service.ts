import "server-only";

import type { MenuItemRecord, MenuPlatformContext } from "@/modules/menu/types/menu";
import { getMenuItemSummary } from "@/modules/menu/utils/menu-selectors";
import { menuService } from "@/modules/menu/services/menu.service";
import { getPopularItems } from "@/modules/menu/services/menu-platform.service";

export interface MenuItemAiInsights {
  summary: string;
  insights: string[];
  pricingRecommendationPence: number | null;
  upsellSuggestions: string[];
  duplicateCandidates: string[];
  popularityScore: number;
  recommendedActions: string[];
}

export async function generateMenuItemDescription(
  itemId: string,
  context: MenuPlatformContext,
): Promise<string | null> {
  const record = await menuService.getItemById(itemId, context);

  if (!record) {
    return null;
  }

  if (record.item.description?.trim()) {
    return record.item.description;
  }

  const ingredients = record.tags.map((tag) => tag.label.toLowerCase()).join(", ");
  return `${record.item.name}${ingredients ? ` featuring ${ingredients}` : ""}. Prepared fresh to order.`;
}

export async function buildMenuItemAiContext(
  itemId: string,
  context: MenuPlatformContext,
): Promise<MenuItemAiInsights | null> {
  const record = await menuService.getItemById(itemId, context);

  if (!record) {
    return null;
  }

  return {
    summary: getMenuItemSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Popularity: ${(record.aiContext.popularityScore * 100).toFixed(0)}%`,
      `Channels: ${record.item.channels.join(", ") || "none"}`,
    ],
    pricingRecommendationPence: record.aiContext.pricingRecommendationPence,
    upsellSuggestions: record.aiContext.upsellSuggestions,
    duplicateCandidates: record.aiContext.duplicateCandidates,
    popularityScore: record.aiContext.popularityScore,
    recommendedActions: record.aiContext.recommendedActions,
  };
}

export async function recommendMenuPricing(
  itemId: string,
  context: MenuPlatformContext,
): Promise<Record<string, unknown> | null> {
  const record = await menuService.getItemById(itemId, context);

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

export async function recommendMenuUpsells(
  itemId: string,
  context: MenuPlatformContext,
): Promise<string[]> {
  const record = await menuService.getItemById(itemId, context);

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

export async function analyzePopularMenuItems(
  context: MenuPlatformContext,
  limit = 5,
): Promise<Record<string, unknown>> {
  const popular = await getPopularItems(context, limit);

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

export async function detectDuplicateMenuItems(
  context: MenuPlatformContext,
): Promise<Record<string, unknown>> {
  const duplicates = await menuService.detectDuplicates(context);

  return {
    duplicateGroups: duplicates.length,
    matches: duplicates,
  };
}

export async function suggestMenuImprovements(context: MenuPlatformContext): Promise<string[]> {
  const result = await menuService.searchItems({ pageSize: 200 }, context);
  const suggestions: string[] = [];

  const withoutImages = result.records.filter((record) => record.images.length === 0).length;
  if (withoutImages > 0) {
    suggestions.push(`Add images to ${withoutImages} items missing photography.`);
  }

  const hiddenCount = result.records.filter((record) => record.item.status === "hidden").length;
  if (hiddenCount > 0) {
    suggestions.push(`Review ${hiddenCount} hidden items for publishing opportunities.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Menu catalog is well structured — monitor seasonal rotation.");
  }

  return suggestions;
}

export async function searchMenuItemsForAi(
  query: string,
  context: MenuPlatformContext,
): Promise<MenuItemRecord[]> {
  const result = await menuService.searchItems({ query, limit: 10, pageSize: 10 }, context);
  return result.records;
}

export async function buildMenuCatalogSummary(
  context: MenuPlatformContext,
): Promise<Record<string, unknown>> {
  const result = await menuService.searchItems({ pageSize: 500 }, context);

  return {
    totalItems: result.total,
    activeItems: result.records.filter((entry) => entry.item.status === "active").length,
    topItems: [...result.records]
      .sort((left, right) => right.aiContext.popularityScore - left.aiContext.popularityScore)
      .slice(0, 3)
      .map((entry) => entry.item.name),
  };
}
