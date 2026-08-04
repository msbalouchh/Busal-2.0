import { financeRepository } from "@/modules/finance/repository/finance-repository";
import type {
  CreateInvoiceInput,
  FinanceRecord,
  FinanceSearchQuery,
  FinanceTransaction,
  Invoice,
  RecordExpenseInput,
  RecordPaymentInput,
} from "@/modules/finance/types/finance-platform";

/** Domain service for finance operations. */
export class FinanceService {
  getRecord(): FinanceRecord {
    return financeRepository.getRecord();
  }

  getInvoiceById(invoiceId: string): Invoice | null {
    return financeRepository.findInvoiceById(invoiceId) ?? null;
  }

  searchTransactions(query: FinanceSearchQuery = {}): FinanceTransaction[] {
    return financeRepository.searchTransactions(query);
  }

  searchInvoices(query: FinanceSearchQuery = {}): Invoice[] {
    return financeRepository.searchInvoices(query);
  }

  createInvoice(input: CreateInvoiceInput): Invoice {
    return financeRepository.createInvoice(input);
  }

  recordExpense(input: RecordExpenseInput): FinanceRecord {
    return financeRepository.recordExpense(input);
  }

  recordPayment(input: RecordPaymentInput): FinanceRecord {
    return financeRepository.recordPayment(input);
  }

  getOverdueInvoices(): Invoice[] {
    return financeRepository.getOverdueInvoices();
  }

  getUnpaidInvoices(): Invoice[] {
    return financeRepository.getUnpaidInvoices();
  }
}

export const financeService = new FinanceService();
