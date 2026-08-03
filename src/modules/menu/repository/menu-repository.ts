import { MENU_ITEM_STATUSES } from "@/modules/menu/constants/menu-status";
import { DEFAULT_MENU_SCOPE, MOCK_MENU_RECORDS } from "@/modules/menu/constants/mock-data";
import type {
  CreateMenuItemInput,
  MenuItemRecord,
  MenuRecord,
  MenuSearchQuery,
  UpdateMenuItemInput,
} from "@/modules/menu/types/menu";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory menu repository (mock only, no backend). */
export class MenuRepository {
  private menus: MenuRecord[] = structuredClone(MOCK_MENU_RECORDS);

  listMenus(): MenuRecord[] {
    return structuredClone(this.menus);
  }

  findMenuById(menuId: string): MenuRecord | undefined {
    return this.menus.find((record) => record.menu.id === menuId);
  }

  listItems(): MenuItemRecord[] {
    return this.menus.flatMap((menu) => menu.items);
  }

  findItemById(itemId: string): MenuItemRecord | undefined {
    for (const menu of this.menus) {
      const item = menu.items.find((record) => record.item.id === itemId);
      if (item) return item;
    }
    return undefined;
  }

  searchItems(query: MenuSearchQuery = {}): MenuItemRecord[] {
    let results = this.listItems();

    if (query.tenantId) {
      results = results.filter((record) => {
        const menu = this.menus.find((m) => m.menu.id === record.item.menuId);
        return menu?.menu.tenantId === query.tenantId;
      });
    }

    if (query.businessId) {
      results = results.filter((record) => {
        const menu = this.menus.find((m) => m.menu.id === record.item.menuId);
        return menu?.menu.businessId === query.businessId;
      });
    }

    if (query.branchId) {
      results = results.filter(
        (record) =>
          record.availability.branchIds.includes(query.branchId!) ||
          record.pricing.branchOverrides.some((o) => o.branchId === query.branchId),
      );
    }

    if (query.menuId) {
      results = results.filter((record) => record.item.menuId === query.menuId);
    }

    if (query.status) {
      results = results.filter((record) => record.item.status === query.status);
    }

    if (query.channel) {
      results = results.filter((record) => record.item.channels.includes(query.channel!));
    }

    if (query.query) {
      const normalized = query.query.toLowerCase();
      results = results.filter((record) => {
        const haystack = [
          record.item.name,
          record.item.description ?? "",
          record.item.sku,
          ...record.tags.map((t) => t.label),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalized);
      });
    }

    const limit = query.limit ?? results.length;
    return structuredClone(results.slice(0, limit));
  }

  createItem(input: CreateMenuItemInput): MenuItemRecord {
    const menu = this.findMenuById(input.menuId);
    if (!menu) {
      throw new Error(`Menu not found: ${input.menuId}`);
    }

    const id = createId("item");
    const now = new Date().toISOString();
    const record: MenuItemRecord = {
      item: {
        id,
        menuId: input.menuId,
        categoryId: input.categoryId,
        sectionId: input.sectionId,
        sku: input.sku ?? `SKU-${id.slice(-6).toUpperCase()}`,
        name: input.name,
        description: input.description ?? null,
        status: input.status ?? MENU_ITEM_STATUSES.DRAFT,
        channels: input.channels ?? menu.menu.channels,
        sortOrder: menu.items.length,
        isFeatured: false,
        createdAt: now,
        updatedAt: now,
      },
      variants: [
        {
          id: `${id}-var-1`,
          itemId: id,
          name: "Regular",
          sku: null,
          isDefault: true,
          priceDeltaPence: 0,
          sortOrder: 0,
        },
      ],
      modifierGroups: [],
      comboMeals: [],
      mealBundles: [],
      addOns: [],
      pricing: {
        itemId: id,
        basePricePence: input.basePricePence,
        compareAtPricePence: null,
        currency: "GBP",
        branchOverrides: [
          { branchId: DEFAULT_MENU_SCOPE.branchId, pricePence: input.basePricePence },
        ],
      },
      taxes: [
        {
          id: `${id}-tax-1`,
          itemId: id,
          name: "VAT",
          rate: 20,
          inclusive: false,
        },
      ],
      availability: {
        itemId: id,
        mode: "always",
        isAvailable: true,
        schedule: [],
        branchIds: [DEFAULT_MENU_SCOPE.branchId],
        hiddenUntil: null,
      },
      preparation: {
        itemId: id,
        prepTimeMinutes: input.prepTimeMinutes ?? 10,
        cookTimeMinutes: 8,
        stationId: "kitchen-main",
        instructions: null,
      },
      nutrition: {
        itemId: id,
        calories: null,
        proteinGrams: null,
        carbsGrams: null,
        fatGrams: null,
        servingSize: null,
      },
      allergens: [],
      images: [],
      tags: [],
      aiContext: {
        itemId: id,
        summary: `${input.name} — new menu item`,
        insights: ["Newly created — review pricing and modifiers"],
        recommendedActions: ["Add image", "Configure modifiers"],
        upsellSuggestions: [],
        pricingRecommendationPence: input.basePricePence,
        popularityScore: 0,
        duplicateCandidates: [],
        lastGeneratedAt: now,
      },
    };

    menu.items.unshift(record);
    return structuredClone(record);
  }

  updateItem(input: UpdateMenuItemInput): MenuItemRecord | undefined {
    const record = this.findItemById(input.itemId);
    if (!record) return undefined;

    const now = new Date().toISOString();

    if (input.name !== undefined) record.item.name = input.name;
    if (input.description !== undefined) record.item.description = input.description;
    if (input.status !== undefined) record.item.status = input.status;
    if (input.channels !== undefined) record.item.channels = input.channels;
    if (input.basePricePence !== undefined) {
      record.pricing.basePricePence = input.basePricePence;
    }
    if (input.prepTimeMinutes !== undefined) {
      record.preparation.prepTimeMinutes = input.prepTimeMinutes;
    }

    record.item.updatedAt = now;
    record.aiContext.lastGeneratedAt = now;

    return structuredClone(record);
  }

  detectDuplicates(): Array<{ itemId: string; duplicates: string[] }> {
    const items = this.listItems();
    const results: Array<{ itemId: string; duplicates: string[] }> = [];

    for (const source of items) {
      const duplicates = items
        .filter((candidate) => candidate.item.id !== source.item.id)
        .filter((candidate) => {
          const a = source.item.name.toLowerCase();
          const b = candidate.item.name.toLowerCase();
          return a.includes(b) || b.includes(a) || a === b;
        })
        .map((candidate) => candidate.item.id);

      if (duplicates.length > 0) {
        results.push({ itemId: source.item.id, duplicates });
      }
    }

    return results;
  }
}

export const menuRepository = new MenuRepository();
