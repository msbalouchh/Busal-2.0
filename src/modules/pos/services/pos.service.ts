import { posRepository } from "@/modules/pos/repository/pos-repository";
import type {
  ApplyPosDiscountInput,
  CreatePosSaleInput,
  MergePosBillsInput,
  PosRecord,
  PosSearchQuery,
  ProcessPosPaymentInput,
  ProcessPosRefundInput,
  SplitPosBillInput,
  TransferPosTableInput,
} from "@/modules/pos/types/pos-platform";

/** Domain service for POS operations. */
export class PosService {
  list(): PosRecord[] {
    return posRepository.listRecords();
  }

  getById(orderId: string): PosRecord | null {
    return posRepository.findById(orderId) ?? null;
  }

  search(query: PosSearchQuery = {}): PosRecord[] {
    return posRepository.search(query);
  }

  createSale(input: CreatePosSaleInput): PosRecord {
    return posRepository.createSale(input);
  }

  applyDiscount(input: ApplyPosDiscountInput): PosRecord | null {
    return posRepository.applyDiscount(input);
  }

  splitBill(input: SplitPosBillInput): PosRecord | null {
    return posRepository.splitBill(input);
  }

  processPayment(input: ProcessPosPaymentInput): PosRecord | null {
    return posRepository.processPayment(input);
  }

  processRefund(input: ProcessPosRefundInput): PosRecord | null {
    return posRepository.processRefund(input);
  }

  transferTable(input: TransferPosTableInput): PosRecord | null {
    return posRepository.transferTable(input);
  }

  mergeBills(input: MergePosBillsInput): PosRecord | null {
    return posRepository.mergeBills(input);
  }
}

export const posService = new PosService();
