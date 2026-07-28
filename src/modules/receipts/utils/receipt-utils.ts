import type { ReceiptData, ReceiptListItem } from "@/services/receipt.service";
import type {
  ReceiptListItemView,
  ReceiptPrintLogView,
  ReceiptView,
} from "@/modules/receipts/types/receipts";
import { formatMoneyPence } from "@/modules/payments/utils/currency";

export function formatReceiptMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export function serializeReceipt(receipt: ReceiptData): ReceiptView {
  return {
    id: receipt.id,
    businessId: receipt.businessId,
    orderId: receipt.orderId,
    paymentId: receipt.paymentId,
    receiptNumber: receipt.receiptNumber,
    businessName: receipt.businessName,
    businessAddress: receipt.businessAddress,
    businessPhone: receipt.businessPhone,
    businessEmail: receipt.businessEmail,
    customerName: receipt.customerName,
    customerPhone: receipt.customerPhone,
    orderNumber: receipt.orderNumber,
    tableName: receipt.tableName,
    staffName: receipt.staffName,
    paymentMethod: receipt.paymentMethod,
    currency: receipt.currency,
    locale: receipt.locale,
    subtotalPence: receipt.subtotalPence,
    discountPence: receipt.discountPence,
    taxPence: receipt.taxPence,
    totalPence: receipt.totalPence,
    paymentAmountPence: receipt.paymentAmountPence,
    amountTenderedPence: receipt.amountTenderedPence,
    changeDuePence: receipt.changeDuePence,
    printCount: receipt.printCount,
    lastPrintStatus: receipt.lastPrintStatus,
    lastPrintedAt: receipt.lastPrintedAt?.toISOString() ?? null,
    createdAt: receipt.createdAt.toISOString(),
    items: receipt.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPricePence: item.unitPricePence,
      lineTotalPence: item.lineTotalPence,
      discountPence: item.discountPence,
      taxRateBps: item.taxRateBps,
    })),
  };
}

export function serializeReceiptListItem(receipt: ReceiptListItem): ReceiptListItemView {
  return {
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    paymentId: receipt.paymentId,
    orderId: receipt.orderId,
    orderNumber: receipt.orderNumber,
    customerName: receipt.customerName,
    paymentMethod: receipt.paymentMethod,
    paymentAmountPence: receipt.paymentAmountPence,
    totalPence: receipt.totalPence,
    printCount: receipt.printCount,
    lastPrintStatus: receipt.lastPrintStatus,
    createdAt: receipt.createdAt.toISOString(),
  };
}

export function serializeReceiptPrintLog(log: {
  id: string;
  templateType: ReceiptPrintLogView["templateType"];
  paperSize: ReceiptPrintLogView["paperSize"];
  status: string;
  isReprint: boolean;
  createdAt: Date;
}): ReceiptPrintLogView {
  return {
    id: log.id,
    templateType: log.templateType,
    paperSize: log.paperSize,
    status: log.status,
    isReprint: log.isReprint,
    createdAt: log.createdAt.toISOString(),
  };
}
