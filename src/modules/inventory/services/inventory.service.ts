import { inventoryRepository } from "@/modules/inventory/repository/inventory-repository";
import type {
  CreateInventoryItemInput,
  CreatePurchaseOrderInput,
  InventoryRecord,
  InventorySearchQuery,
  PurchaseOrder,
  RecordWasteInput,
  UpdateStockInput,
} from "@/modules/inventory/types/inventory-platform";

/** Domain service for inventory operations. */
export class InventoryService {
  list(): InventoryRecord[] {
    return inventoryRepository.listRecords();
  }

  getById(itemId: string): InventoryRecord | null {
    return inventoryRepository.findById(itemId) ?? null;
  }

  search(query: InventorySearchQuery = {}): InventoryRecord[] {
    return inventoryRepository.search(query);
  }

  createItem(input: CreateInventoryItemInput): InventoryRecord {
    return inventoryRepository.createItem(input);
  }

  updateStock(input: UpdateStockInput): InventoryRecord | null {
    return inventoryRepository.updateStock(input);
  }

  recordWaste(input: RecordWasteInput): InventoryRecord | null {
    return inventoryRepository.recordWaste(input);
  }

  createPurchaseOrder(input: CreatePurchaseOrderInput): PurchaseOrder {
    return inventoryRepository.createPurchaseOrder(input);
  }

  getLowStockItems(): InventoryRecord[] {
    return inventoryRepository.getLowStockRecords();
  }

  getExpiringItems(withinDays?: number): InventoryRecord[] {
    return inventoryRepository.getExpiringRecords(withinDays);
  }
}

export const inventoryService = new InventoryService();
