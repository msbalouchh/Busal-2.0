import "server-only";

import type { MenuItemRecord, MenuPlatformContext } from "@/modules/menu/types/menu";
import { getMenuItemSummary } from "@/modules/menu/utils/menu-selectors";
import { menuService } from "@/modules/menu/services/menu.service";
import { getPopularItems } from "@/modules/menu/services/menu-platform.service";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "menu";

function toModulePlatform(context: MenuPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runMenuAiInference<T extends Record<string, unknown>>(
  context: MenuPlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

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

  const dataContext = {
    itemId,
    name: record.item.name,
    tags: record.tags.map((tag) => tag.label),
    channels: record.item.channels,
    prepTimeMinutes: record.preparation.prepTimeMinutes,
  };

  const aiResult = await runMenuAiInference<{ description?: string }>(
    context,
    "generateMenuItemDescription",
    dataContext,
    "Generate menu item description. Return JSON with description string.",
  );

  if (aiResult?.description) {
    return aiResult.description;
  }

  const ingredients = record.tags.map((tag) => tag.label.toLowerCase()).join(", ");
  return `${record.item.name}${ingredients ? ` featuring ${ingredients}` : ""}.`;
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
  const dataContext = {
    itemId,
    itemName: record.item.name,
    currentPricePence: current,
    pricingRecommendationPence: record.aiContext.pricingRecommendationPence,
    popularityScore: record.aiContext.popularityScore,
    branchOverrides: record.pricing.branchOverrides,
  };

  const aiResult = await runMenuAiInference<Record<string, unknown>>(
    context,
    "recommendMenuPricing",
    dataContext,
    "Recommend menu pricing. Return JSON with itemId, itemName, currentPricePence, recommendedPricePence, deltaPence, rationale, and branchOverrides.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    itemId,
    itemName: record.item.name,
    currentPricePence: current,
    pricingRecommendationPence: record.aiContext.pricingRecommendationPence,
    popularityScore: record.aiContext.popularityScore,
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

  const dataContext = {
    itemId,
    itemName: record.item.name,
    existingSuggestions: record.aiContext.upsellSuggestions,
    prepTimeMinutes: record.preparation.prepTimeMinutes,
    popularityScore: record.aiContext.popularityScore,
  };

  const aiResult = await runMenuAiInference<{ suggestions?: string[] }>(
    context,
    "recommendMenuUpsells",
    dataContext,
    "Recommend menu upsells. Return JSON with suggestions string array.",
  );

  if (aiResult?.suggestions?.length) {
    return aiResult.suggestions;
  }

  return record.aiContext.upsellSuggestions;
}

export async function analyzePopularMenuItems(
  context: MenuPlatformContext,
  limit = 5,
): Promise<Record<string, unknown>> {
  const popular = await getPopularItems(context, limit);
  const dataContext = {
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

  const aiResult = await runMenuAiInference<Record<string, unknown>>(
    context,
    "analyzePopularMenuItems",
    dataContext,
    "Analyze popular menu items. Return JSON with itemCount, items, topPerformer, and insights.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function detectDuplicateMenuItems(
  context: MenuPlatformContext,
): Promise<Record<string, unknown>> {
  const duplicates = await menuService.detectDuplicates(context);
  const dataContext = {
    duplicateGroups: duplicates.length,
    matches: duplicates,
  };

  const aiResult = await runMenuAiInference<Record<string, unknown>>(
    context,
    "detectDuplicateMenuItems",
    dataContext,
    "Detect duplicate menu items. Return JSON with duplicateGroups, matches, and recommendedActions.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function suggestMenuImprovements(context: MenuPlatformContext): Promise<string[]> {
  const result = await menuService.searchItems({ pageSize: 200 }, context);
  const dataContext = {
    totalItems: result.total,
    withoutImages: result.records.filter((record) => record.images.length === 0).length,
    hiddenCount: result.records.filter((record) => record.item.status === "hidden").length,
    activeCount: result.records.filter((entry) => entry.item.status === "active").length,
  };

  const aiResult = await runMenuAiInference<{ suggestions?: string[] }>(
    context,
    "suggestMenuImprovements",
    dataContext,
    "Suggest menu improvements. Return JSON with suggestions string array.",
  );

  if (aiResult?.suggestions?.length) {
    return aiResult.suggestions;
  }

  return [];
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
