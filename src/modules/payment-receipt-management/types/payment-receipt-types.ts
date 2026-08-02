import type {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderType,
  PaymentTransactionType,
  RestaurantOrderPaymentStatus,
} from "@prisma/client";

export interface OrderPaymentTransactionRecord {
  id: string;
  transactionType: PaymentTransactionType;
  amount: number;
  status: OrderPaymentStatus;
  reference: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface OrderReceiptRecord {
  id: string;
  receiptNumber: string;
  receiptUrl: string | null;
  printedCount: number;
  emailedAt: string | null;
  smsSentAt: string | null;
  createdAt: string;
}

export interface OrderPaymentRecord {
  id: string;
  businessId: string;
  branchId: string;
  orderId: string;
  paymentNumber: string;
  paymentMethod: OrderPaymentMethod;
  paymentProvider: string | null;
  status: OrderPaymentStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  tipAmount: number;
  amountPaid: number;
  changeGiven: number;
  currency: string;
  exchangeRate: number | null;
  transactionReference: string | null;
  gatewayReference: string | null;
  processedByStaffId: string | null;
  processedByStaffName: string | null;
  paidAt: string | null;
  orderNumber: string;
  orderType: OrderType;
  orderTotal: number;
  orderPaymentStatus: RestaurantOrderPaymentStatus;
  tableLabel: string | null;
  customerName: string | null;
  transactions: OrderPaymentTransactionRecord[];
  receipt: OrderReceiptRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPaymentSummary {
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  orderTotal: number;
  amountPaid: number;
  remainingBalance: number;
  changeDue: number;
  paymentStatus: RestaurantOrderPaymentStatus;
  payments: OrderPaymentRecord[];
}

export interface OrderPaymentListQuery {
  branchId: string;
  search?: string;
  status?: OrderPaymentStatus | "ALL";
  paymentMethod?: OrderPaymentMethod | "ALL";
  page?: number;
  pageSize?: number;
}

export interface OrderPaymentListResult {
  items: OrderPaymentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaymentDashboardStats {
  paymentsToday: number;
  revenueToday: number;
  refundsToday: number;
  unpaidOrders: number;
}

export interface RecordOrderPaymentInput {
  branchId: string;
  orderId: string;
  paymentMethod: OrderPaymentMethod;
  amountPaid: number;
  amountTendered?: number;
  tipAmount?: number;
  paymentProvider?: string | null;
  transactionReference?: string | null;
  gatewayReference?: string | null;
  currency?: string;
}

export interface SplitPaymentLineInput {
  paymentMethod: OrderPaymentMethod;
  amountPaid: number;
  amountTendered?: number;
  tipAmount?: number;
  paymentProvider?: string | null;
}

export interface SplitOrderPaymentInput {
  branchId: string;
  orderId: string;
  lines: SplitPaymentLineInput[];
  transactionReference?: string | null;
  currency?: string;
}

export interface RefundOrderPaymentInput {
  branchId: string;
  paymentId: string;
  amount: number;
  reference?: string | null;
}

export interface VoidOrderPaymentInput {
  branchId: string;
  paymentId: string;
  reference?: string | null;
}

export interface EmailReceiptInput {
  branchId: string;
  receiptId: string;
  email: string;
}

export interface SmsReceiptInput {
  branchId: string;
  receiptId: string;
  phone: string;
}

export interface UnpaidOrderOption {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  tableLabel: string | null;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
}
