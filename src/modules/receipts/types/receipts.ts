import type { PaymentMethod } from "@prisma/client";

import type {
  ReceiptPaperSizeOption,
  ReceiptTemplateTypeOption,
} from "@/modules/receipts/constants/routes";

export interface ReceiptItemView {
  id: string;
  name: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
  discountPence: number;
  taxRateBps: number | null;
}

export interface ReceiptView {
  id: string;
  businessId: string;
  orderId: string;
  paymentId: string;
  receiptNumber: string;
  businessName: string;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  orderNumber: string;
  tableName: string | null;
  staffName: string | null;
  paymentMethod: PaymentMethod;
  currency: string;
  locale: string;
  subtotalPence: number;
  discountPence: number;
  taxPence: number;
  totalPence: number;
  paymentAmountPence: number;
  amountTenderedPence: number | null;
  changeDuePence: number;
  printCount: number;
  lastPrintStatus: string | null;
  lastPrintedAt: string | null;
  createdAt: string;
  items: ReceiptItemView[];
}

export interface ReceiptListItemView {
  id: string;
  receiptNumber: string;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  paymentMethod: PaymentMethod;
  paymentAmountPence: number;
  totalPence: number;
  printCount: number;
  lastPrintStatus: string | null;
  createdAt: string;
}

export interface ReceiptPrintLogView {
  id: string;
  templateType: ReceiptTemplateTypeOption;
  paperSize: ReceiptPaperSizeOption;
  status: string;
  isReprint: boolean;
  createdAt: string;
}
