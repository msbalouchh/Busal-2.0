import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import { inventoryRepository, type InventorySearchResult } from "@/modules/inventory/repository/inventory-repository";
import type { InventoryPlatformContext } from "@/modules/inventory/types/inventory-platform";
import type {
  CreateInventoryItemInput,
  CreatePurchaseOrderInput,
  InventoryRecord,
  InventorySearchQuery,
  PurchaseOrder,
  RecordWasteInput,
  UpdateStockInput,
} from "@/modules/inventory/types/inventory-platform";
import {
  resolveInventoryScope,
  toInventoryPlatformContext,
  type InventoryTenantScope,
} from "@/modules/inventory/lib/inventory-scope";
import type {
  CreateInventoryItemSchemaInput,
  CreateInventoryPurchaseOrderSchemaInput,
  CreateInventoryTransferSchemaInput,
  InventoryBulkActionSchemaInput,
  InventorySearchSchemaInput,
  ReceiveInventoryGoodsSchemaInput,
  RecordInventoryWasteSchemaInput,
  UpdateInventoryItemSchemaInput,
  UpdateInventoryStockSchemaInput,
} from "@/modules/inventory/validation/inventory-schemas";

function resolveScope(context: InventoryPlatformContext): InventoryTenantScope {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    defaultLocationId: context.defaultLocationId,
  };
}

/** Domain service for inventory operations. */
export class InventoryService {
  async list(context: InventoryPlatformContext) {
    return inventoryRepository.listRecords(resolveScope(context));
  }

  async search(query: InventorySearchSchemaInput, context: InventoryPlatformContext): Promise<InventorySearchResult>;
  async search(query: InventorySearchQuery, context: InventoryPlatformContext): Promise<InventorySearchResult>;
  async search(
    query: InventorySearchQuery | InventorySearchSchemaInput,
    context: InventoryPlatformContext,
  ): Promise<InventorySearchResult> {
    const scopedQuery =
      "tenantId" in query || "businessId" in query || "branchId" in query
        ? {
            ...query,
            tenantId: query.tenantId ?? context.tenantId,
            businessId: query.businessId ?? context.businessId,
            branchId: query.branchId ?? context.branchId,
          }
        : query;

    return inventoryRepository.search(resolveScope(context), scopedQuery);
  }

  async getById(context: InventoryPlatformContext, itemId: string): Promise<InventoryRecord | null> {
    return inventoryRepository.findById(resolveScope(context), itemId);
  }

  async listCategories(context: InventoryPlatformContext) {
    return inventoryRepository.listCategories(resolveScope(context));
  }

  async listLocations(context: InventoryPlatformContext) {
    return inventoryRepository.listLocations(resolveScope(context));
  }

  async listSuppliers(context: InventoryPlatformContext) {
    return inventoryRepository.listSuppliers(resolveScope(context));
  }

  async listPurchaseOrders(context: InventoryPlatformContext) {
    return inventoryRepository.listPurchaseOrders(resolveScope(context));
  }

  async listRecipeMappings(context: InventoryPlatformContext) {
    return inventoryRepository.listRecipeMappings(resolveScope(context));
  }

  async createItem(
    context: InventoryPlatformContext,
    input: CreateInventoryItemInput | CreateInventoryItemSchemaInput,
  ): Promise<InventoryRecord> {
    return inventoryRepository.createItem(resolveScope(context), {
      ...input,
      branchId: context.branchId,
    });
  }

  async updateItem(context: InventoryPlatformContext, input: UpdateInventoryItemSchemaInput) {
    return inventoryRepository.updateItem(resolveScope(context), input);
  }

  async archiveItem(context: InventoryPlatformContext, itemId: string) {
    return inventoryRepository.archiveItem(resolveScope(context), itemId);
  }

  async restoreItem(context: InventoryPlatformContext, itemId: string) {
    return inventoryRepository.restoreItem(resolveScope(context), itemId);
  }

  async bulkAction(context: InventoryPlatformContext, input: InventoryBulkActionSchemaInput) {
    return inventoryRepository.bulkAction(resolveScope(context), input);
  }

  async updateStock(
    context: InventoryPlatformContext,
    input: UpdateStockInput | UpdateInventoryStockSchemaInput,
  ): Promise<InventoryRecord | null> {
    const record = await inventoryRepository.updateStock(resolveScope(context), {
      ...input,
      employeeId: "employeeId" in input ? input.employeeId : context.userId,
    });
    if (record) {
      const itemId = record.item.id;
      const currentStock = record.stocks.reduce((sum, stock) => sum + stock.quantityOnHand, 0);
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.INVENTORY_UPDATED,
        aggregateId: itemId,
        payload: { itemId, currentStock },
        idempotencyKey: `inventory.updated:${itemId}:${Date.now()}`,
      });
      if (currentStock <= record.item.reorderPoint) {
        await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
          eventType: DOMAIN_EVENT_TYPES.INVENTORY_LOW_STOCK,
          aggregateId: itemId,
          payload: {
            itemId,
            currentStock,
            reorderLevel: record.item.reorderPoint,
          },
          idempotencyKey: `inventory.low_stock:${itemId}:${currentStock}`,
        });
      }
    }
    return record;
  }

  async recordWaste(
    context: InventoryPlatformContext,
    input: RecordWasteInput | RecordInventoryWasteSchemaInput,
  ): Promise<InventoryRecord | null> {
    const record = await inventoryRepository.recordWaste(resolveScope(context), {
      ...input,
      recordedByEmployeeId:
        "recordedByEmployeeId" in input ? input.recordedByEmployeeId : context.userId,
    });
    if (record) {
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.INVENTORY_WASTE_RECORDED,
        aggregateId: record.item.id,
        payload: { itemId: record.item.id, wasteQuantity: "quantity" in input ? input.quantity : null },
      });
    }
    return record;
  }

  async createPurchaseOrder(
    context: InventoryPlatformContext,
    input: CreatePurchaseOrderInput | CreateInventoryPurchaseOrderSchemaInput,
  ): Promise<PurchaseOrder> {
    return inventoryRepository.createPurchaseOrder(resolveScope(context), {
      ...input,
      branchId: context.branchId,
      createdByEmployeeId: "createdByEmployeeId" in input ? input.createdByEmployeeId : context.userId,
    });
  }

  async receiveGoods(context: InventoryPlatformContext, input: ReceiveInventoryGoodsSchemaInput) {
    const record = await inventoryRepository.receiveGoods(resolveScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.INVENTORY_RECEIVED,
      aggregateId: input.purchaseOrderId,
      payload: {
        purchaseOrderId: input.purchaseOrderId,
        lineItems: input.lineItems,
      },
    });
    return record;
  }

  async createTransfer(context: InventoryPlatformContext, input: CreateInventoryTransferSchemaInput) {
    return inventoryRepository.createTransfer(resolveScope(context), input);
  }

  async getLowStockItems(context: InventoryPlatformContext) {
    return inventoryRepository.getLowStockRecords(resolveScope(context));
  }

  async getExpiringItems(context: InventoryPlatformContext, withinDays?: number) {
    return inventoryRepository.getExpiringRecords(resolveScope(context), withinDays);
  }
}

export const inventoryService = new InventoryService();

export { resolveInventoryScope, toInventoryPlatformContext };
