import type { PaymentMethod, PaymentStatus } from "@prisma/client";

/** Monetary fields are stored in pence. */
export interface PaymentView {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  amountTendered: number | null;
  status: PaymentStatus;
  notes: string | null;
  createdAt: string;
}

export interface OrderPaymentSummaryView {
  orderId: string;
  orderNumber: string;
  /** Values are stored in pence. */
  orderTotal: number;
  amountPaid: number;
  remainingBalance: number;
  changeDue: number;
  isFullyPaid: boolean;
  payments: PaymentView[];
}

export interface UnpaidOrderView {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  amountPaid: number;
  remainingBalance: number;
  customerName: string | null;
  tableName: string | null;
  createdAt: string;
  isFullyPaid: boolean;
}

export interface PaymentOrderContextView {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  customerName: string | null;
  tableName: string | null;
  itemCount: number;
  summary: OrderPaymentSummaryView;
}
