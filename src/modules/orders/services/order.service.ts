import { orderRepository } from "@/modules/orders/repository/order-repository";
import type {
  CreateOrderInput,
  ModifyOrderInput,
  OmsPlatformContext,
  OrderRecord,
  OrderSearchQuery,
} from "@/modules/orders/types/order";

export class OrderService {
  search(query: OrderSearchQuery, context?: OmsPlatformContext): OrderRecord[] {
    return orderRepository.search({
      ...query,
      tenantId: query.tenantId ?? context?.tenantId,
      businessId: query.businessId ?? context?.businessId,
      branchId: query.branchId ?? context?.branchId,
    });
  }

  getById(orderId: string): OrderRecord | undefined {
    return orderRepository.findById(orderId);
  }

  getByOrderNumber(orderNumber: string): OrderRecord | undefined {
    return orderRepository.findByOrderNumber(orderNumber);
  }

  create(input: CreateOrderInput): OrderRecord {
    return orderRepository.create(input);
  }

  modify(input: ModifyOrderInput): OrderRecord | undefined {
    return orderRepository.modify(input);
  }

  cancel(orderId: string, reason?: string): OrderRecord | undefined {
    return orderRepository.cancel(orderId, reason);
  }

  refund(orderId: string): OrderRecord | undefined {
    return orderRepository.refund(orderId);
  }

  getTimeline(orderId: string) {
    return orderRepository.findById(orderId)?.timeline ?? [];
  }

  getPayments(orderId: string) {
    return orderRepository.findById(orderId)?.payments ?? [];
  }

  getFulfillment(orderId: string) {
    return orderRepository.findById(orderId)?.fulfillment ?? null;
  }

  getAnalytics(orderId: string) {
    return orderRepository.findById(orderId)?.analytics ?? null;
  }

  getAiContext(orderId: string) {
    return orderRepository.findById(orderId)?.aiContext ?? null;
  }
}

export const orderService = new OrderService();
