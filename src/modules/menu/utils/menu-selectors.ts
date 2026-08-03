import { MENU_ITEM_STATUSES, type MenuItemStatus } from "@/modules/menu/constants/menu-status";
import type { MenuItemRecord } from "@/modules/menu/types/menu";

export function formatMenuPrice(pence: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);
}

export function getMenuItemSummary(record: MenuItemRecord): string {
  const { item, pricing } = record;
  return `${item.name} · ${item.sku} · ${formatMenuPrice(pricing.basePricePence, pricing.currency)}`;
}

export function isActiveMenuItem(status: MenuItemStatus): boolean {
  return status === MENU_ITEM_STATUSES.ACTIVE || status === MENU_ITEM_STATUSES.SEASONAL;
}

export function isVisibleMenuItem(record: MenuItemRecord): boolean {
  return (
    record.availability.isAvailable &&
    record.item.status !== MENU_ITEM_STATUSES.HIDDEN &&
    record.item.status !== MENU_ITEM_STATUSES.ARCHIVED &&
    record.item.status !== MENU_ITEM_STATUSES.DRAFT
  );
}

export function sortByPopularity(records: MenuItemRecord[]): MenuItemRecord[] {
  return [...records].sort((a, b) => b.aiContext.popularityScore - a.aiContext.popularityScore);
}

export function countByStatus(records: MenuItemRecord[]): Record<MenuItemStatus, number> {
  const counts = Object.fromEntries(
    Object.values(MENU_ITEM_STATUSES).map((status) => [status, 0]),
  ) as Record<MenuItemStatus, number>;

  for (const record of records) {
    const status = record.item.status;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return counts;
}

export function filterByChannel(
  records: MenuItemRecord[],
  channel: MenuItemRecord["item"]["channels"][number],
): MenuItemRecord[] {
  return records.filter((record) => record.item.channels.includes(channel));
}
