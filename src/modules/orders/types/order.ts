import type {
  FulfillmentStatus,
  OrderSource,
  OrderStatus,
  OrderTimelineEventType,
  OrderType,
  PaymentStatus,
} from "@/modules/orders/constants/order-status";

/** Core order entity — central transaction identifier. */
export interface Order {
  id: string;
  orderNumber: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  customerId: string | null;
  customerName: string | null;
  orderType: OrderType;
  status: OrderStatus;
  currency: string;
  subtotalPence: number;
  discountTotalPence: number;
  taxTotalPence: number;
  totalPence: number;
  tableNumber: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
  modifiers: string[];
  notes: string | null;
}

export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  type: OrderTimelineEventType;
  title: string;
  description: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  metadata: Record<string, string>;
  occurredAt: string;
  createdBy: string | null;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  method: "card" | "cash" | "wallet" | "gift_card" | "invoice";
  status: PaymentStatus;
  amountPence: number;
  reference: string | null;
  processedAt: string | null;
}

export interface OrderDiscount {
  id: string;
  orderId: string;
  code: string | null;
  label: string;
  type: "percentage" | "fixed";
  value: number;
  amountPence: number;
}

export interface OrderTax {
  id: string;
  orderId: string;
  name: string;
  rate: number;
  amountPence: number;
}

export interface OrderNote {
  id: string;
  orderId: string;
  content: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: string;
}

export interface OrderSourceRecord {
  orderId: string;
  source: OrderSource;
  channel: string;
  deviceId: string | null;
  staffId: string | null;
  referrer: string | null;
}

export interface OrderFulfillment {
  orderId: string;
  status: FulfillmentStatus;
  assignedTo: string | null;
  stationId: string | null;
  estimatedReadyAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  deliveryAddress: string | null;
  trackingReference: string | null;
}

export interface OrderHistoryEntry {
  id: string;
  orderId: string;
  action: string;
  snapshot: Record<string, string>;
  performedBy: string | null;
  performedAt: string;
}

export interface OrderAnalytics {
  orderId: string;
  itemCount: number;
  prepTimeMinutes: number | null;
  fulfillmentTimeMinutes: number | null;
  marginEstimatePence: number;
  upsellPotentialPence: number;
  delayRiskScore: number;
}

export interface OrderAiContext {
  orderId: string;
  summary: string;
  insights: string[];
  recommendedActions: string[];
  upsellSuggestions: string[];
  delayPredictionMinutes: number | null;
  lastGeneratedAt: string;
}

/** Full order record aggregating all OMS sub-entities. */
export interface OrderRecord {
  order: Order;
  items: OrderItem[];
  timeline: OrderTimelineEvent[];
  payments: OrderPayment[];
  discounts: OrderDiscount[];
  taxes: OrderTax[];
  notes: OrderNote[];
  source: OrderSourceRecord;
  fulfillment: OrderFulfillment;
  history: OrderHistoryEntry[];
  analytics: OrderAnalytics;
  aiContext: OrderAiContext;
}

export interface OrderSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  status?: OrderStatus;
  orderType?: OrderType;
  customerId?: string;
  limit?: number;
}

export interface CreateOrderInput {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  customerId?: string | null;
  customerName?: string | null;
  orderType: OrderType;
  source: OrderSource;
  tableNumber?: string | null;
  scheduledFor?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPricePence: number;
    modifiers?: string[];
    notes?: string | null;
  }>;
}

export interface ModifyOrderInput {
  orderId: string;
  status?: OrderStatus;
  tableNumber?: string | null;
  scheduledFor?: string | null;
  items?: CreateOrderInput["items"];
  note?: string;
}

export interface OmsPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export interface OrdersContextValue {
  context: OmsPlatformContext;
  orders: OrderRecord[];
  selectedOrder: OrderRecord | null;
  selectOrder: (orderId: string | null) => void;
  searchOrders: (query: OrderSearchQuery) => OrderRecord[];
  refresh: () => void;
}
