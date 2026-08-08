"use server";

import { revalidatePath } from "next/cache";

import { FINANCE_MODULE_PERMISSIONS } from "@/modules/finance/constants/permissions";
import { FINANCE_PLATFORM_ROUTES } from "@/modules/finance/constants/platform-routes";
import { assertFinanceFeatureFromPlatform } from "@/modules/finance/feature-access/guards/feature.guard";
import { resolveFinanceScope, toFinancePlatformContext } from "@/modules/finance/lib/finance-scope";
import { protectedAction, type PlatformProtectedActionContext } from "@/modules/platform-guards/guards/action.guards";
import type { ProtectedActionRequirement } from "@/modules/authorization/lib/protected-action";
import { financeService } from "@/modules/finance/services/finance.service";
import {
  createBudgetSchema,
  createCostCenterSchema,
  createFinanceAccountSchema,
  createFinanceInvoiceSchema,
  createFinanceTaxSchema,
  createJournalEntrySchema,
  financeBulkActionSchema,
  recordFinanceExpenseSchema,
  recordFinancePaymentSchema,
  updateFinanceAccountSchema,
  updateJournalEntrySchema,
} from "@/modules/finance/validation/finance-schemas";

function revalidateFinancePaths() {
  Object.values(FINANCE_PLATFORM_ROUTES).forEach((path) => revalidatePath(path));
}

function protectedFinanceAction<T>(
  permission: ProtectedActionRequirement,
  handler: (context: PlatformProtectedActionContext) => Promise<T>,
) {
  return protectedAction(permission, async (context) => {
    await assertFinanceFeatureFromPlatform(context.platform);
    return handler(context);
  });
}

export async function createFinanceInvoiceAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE, async ({ platform }) => {
    const body = createFinanceInvoiceSchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const invoice = await financeService.createInvoice(context, body);
    revalidateFinancePaths();
    return { success: true as const, invoice };
  });
}

export async function createFinanceAccountAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE, async ({ platform }) => {
    const body = createFinanceAccountSchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const account = await financeService.createAccount(context, body);
    revalidateFinancePaths();
    return { success: true as const, account };
  });
}

export async function updateFinanceAccountAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_UPDATE, async ({ platform }) => {
    const body = updateFinanceAccountSchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const account = await financeService.updateAccount(context, body);
    revalidateFinancePaths();
    return { success: true as const, account };
  });
}

export async function createJournalEntryAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE, async ({ platform }) => {
    const body = createJournalEntrySchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const entry = await financeService.createJournalEntry(context, body);
    revalidateFinancePaths();
    return { success: true as const, entry };
  });
}

export async function updateJournalEntryAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_UPDATE, async ({ platform }) => {
    const body = updateJournalEntrySchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const entry = await financeService.updateJournalEntry(context, body);
    revalidateFinancePaths();
    return { success: true as const, entry };
  });
}

export async function deleteJournalEntryAction(journalEntryId: string) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_DELETE, async ({ platform }) => {
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const deleted = await financeService.deleteJournalEntry(context, journalEntryId);
    revalidateFinancePaths();
    return { success: true as const, deleted };
  });
}

export async function recordFinanceExpenseAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE, async ({ platform }) => {
    const body = recordFinanceExpenseSchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const record = await financeService.recordExpense(context, body);
    revalidateFinancePaths();
    return { success: true as const, record };
  });
}

export async function recordFinancePaymentAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE, async ({ platform }) => {
    const body = recordFinancePaymentSchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const record = await financeService.recordPayment(context, {
      ...body,
      recordedByUserId: context.userId,
    });
    revalidateFinancePaths();
    return { success: true as const, record };
  });
}

export async function createCostCenterAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE, async ({ platform }) => {
    const body = createCostCenterSchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const costCenter = await financeService.createCostCenter(context, body);
    revalidateFinancePaths();
    return { success: true as const, costCenter };
  });
}

export async function createBudgetAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE, async ({ platform }) => {
    const body = createBudgetSchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const budget = await financeService.createBudget(context, body);
    revalidateFinancePaths();
    return { success: true as const, budget };
  });
}

export async function createFinanceTaxAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE, async ({ platform }) => {
    const body = createFinanceTaxSchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const tax = await financeService.createTaxRecord(context, body);
    revalidateFinancePaths();
    return { success: true as const, tax };
  });
}

export async function bulkFinanceAction(input: unknown) {
  return protectedFinanceAction(FINANCE_MODULE_PERMISSIONS.FINANCE_APPROVE, async ({ platform }) => {
    const body = financeBulkActionSchema.parse(input);
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const affected = await financeService.bulkAction(context, body);
    revalidateFinancePaths();
    return { success: true as const, affected };
  });
}
