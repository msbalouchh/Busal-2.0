import "server-only";

import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import { orderRepository, type OrderSearchResult } from "@/modules/orders/repository/order-repository";
import { buildOrderScopeFromInput } from "@/modules/orders/lib/order-scope";
import type {
  CreateOrderInput,
  ModifyOrderInput,
  OmsPlatformContext,
  OrderRecord,
  OrderSearchQuery,
} from "@/modules/orders/types/order";
import type {
  BulkUpdateOrdersSchemaInput,
  MergeOrdersSchemaInput,
  SplitOrderSchemaInput,
} from "@/modules/orders/validation/order-schemas";

function toScope(context: OmsPlatformContext) {
  return buildOrderScopeFromInput(context);
}

export class OrderService {
  async search(query: OrderSearchQuery, context: OmsPlatformContext): Promise<OrderSearchResult> {
    return orderRepository.search(toScope(context), {
      ...query,
      tenantId: query.tenantId ?? context.tenantId,
      businessId: query.businessId ?? context.businessId,
      branchId: query.branchId ?? context.branchId,
    });
  }

  async getById(context: OmsPlatformContext, orderId: string): Promise<OrderRecord | null> {
    return orderRepository.findById(toScope(context), orderId);
  }

  async getByOrderNumber(context: OmsPlatformContext, orderNumber: string): Promise<OrderRecord | null> {
    return orderRepository.findByOrderNumber(toScope(context), orderNumber);
  }

  async create(context: OmsPlatformContext, input: CreateOrderInput): Promise<OrderRecord> {
    const record = await orderRepository.create(toScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.ORDER_CREATED,
      aggregateId: record.order.id,
      payload: {
        orderId: record.order.id,
        status: record.order.status,
        customerId: record.order.customerId ?? null,
        tableId: null,
      },
    });
    return record;
  }

  async modify(context: OmsPlatformContext, input: ModifyOrderInput): Promise<OrderRecord | null> {
    const record = await orderRepository.modify(toScope(context), input);
    if (record) {
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.ORDER_UPDATED,
        aggregateId: record.order.id,
        payload: { orderId: record.order.id, status: record.order.status },
        idempotencyKey: `order.updated:${record.order.id}:${record.order.status}`,
      });
    }
    return record;
  }

  async cancel(context: OmsPlatformContext, orderId: string, reason?: string): Promise<OrderRecord | null> {
    const record = await orderRepository.cancel(toScope(context), orderId, reason);
    if (record) {
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.ORDER_CANCELLED,
        aggregateId: record.order.id,
        payload: { orderId: record.order.id, reason: reason ?? null },
      });
    }
    return record;
  }

  async refund(context: OmsPlatformContext, orderId: string, reason?: string): Promise<OrderRecord | null> {
    return orderRepository.refund(toScope(context), orderId, reason);
  }

  async assignTable(context: OmsPlatformContext, orderId: string, tableId: string): Promise<OrderRecord | null> {
    return orderRepository.assignTable(toScope(context), orderId, tableId);
  }

  async assignCustomer(
    context: OmsPlatformContext,
    orderId: string,
    customerId: string,
  ): Promise<OrderRecord | null> {
    return orderRepository.assignCustomer(toScope(context), orderId, customerId);
  }

  async transfer(
    context: OmsPlatformContext,
    orderId: string,
    targetBranchId: string,
    targetTableId?: string,
  ): Promise<OrderRecord | null> {
    return orderRepository.transfer(toScope(context), orderId, targetBranchId, targetTableId);
  }

  async mergeOrders(context: OmsPlatformContext, input: MergeOrdersSchemaInput): Promise<OrderRecord | null> {
    return orderRepository.mergeOrders(toScope(context), input);
  }

  async splitOrder(context: OmsPlatformContext, input: SplitOrderSchemaInput): Promise<OrderRecord[]> {
    return orderRepository.splitOrder(toScope(context), input);
  }

  async archive(context: OmsPlatformContext, orderId: string): Promise<OrderRecord | null> {
    return orderRepository.archive(toScope(context), orderId);
  }

  async restore(context: OmsPlatformContext, orderId: string): Promise<OrderRecord | null> {
    return orderRepository.restore(toScope(context), orderId);
  }

  async deleteHard(context: OmsPlatformContext, orderId: string): Promise<boolean> {
    return orderRepository.deleteHard(toScope(context), orderId);
  }

  async bulkUpdate(context: OmsPlatformContext, input: BulkUpdateOrdersSchemaInput): Promise<number> {
    return orderRepository.bulkUpdate(toScope(context), input);
  }

  async list(context: OmsPlatformContext): Promise<OrderRecord[]> {
    return orderRepository.list(toScope(context));
  }

  async getTimeline(context: OmsPlatformContext, orderId: string) {
    const record = await this.getById(context, orderId);
    return record?.timeline ?? [];
  }

  async getPayments(context: OmsPlatformContext, orderId: string) {
    const record = await this.getById(context, orderId);
    return record?.payments ?? [];
  }

  async getFulfillment(context: OmsPlatformContext, orderId: string) {
    const record = await this.getById(context, orderId);
    return record?.fulfillment ?? null;
  }

  async getAnalytics(context: OmsPlatformContext, orderId: string) {
    const record = await this.getById(context, orderId);
    return record?.analytics ?? null;
  }

  async getAiContext(context: OmsPlatformContext, orderId: string) {
    const record = await this.getById(context, orderId);
    return record?.aiContext ?? null;
  }
}

export const orderService = new OrderService();
