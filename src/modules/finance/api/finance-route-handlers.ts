import "server-only";

import { NextResponse } from "next/server";

import { FINANCE_MODULE_PERMISSIONS } from "@/modules/finance/constants/permissions";
import { assertFinanceFeatureFromPlatform } from "@/modules/finance/feature-access/guards/feature.guard";
import { resolveFinanceScope, toFinancePlatformContext } from "@/modules/finance/lib/finance-scope";
import { financeService } from "@/modules/finance/services/finance.service";
import { buildFinancePlatformSnapshot } from "@/modules/finance/services/finance-platform.service";
import {
  createBudgetSchema,
  createCostCenterSchema,
  createFinanceAccountSchema,
  createFinanceInvoiceSchema,
  createFinanceTaxSchema,
  createJournalEntrySchema,
  financeBulkActionSchema,
  financeSearchSchema,
  journalEntryActionSchema,
  recordFinanceExpenseSchema,
  recordFinancePaymentSchema,
  updateFinanceAccountSchema,
  updateJournalEntrySchema,
} from "@/modules/finance/validation/finance-schemas";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

async function protectedFinanceRoute(
  options: Parameters<typeof protectedRoute>[0] = {},
) {
  const platform = await protectedRoute(options);
  await assertFinanceFeatureFromPlatform(platform);
  return platform;
}

export async function handleListFinance(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_READ });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const url = new URL(request.url);
    const parsed = financeSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const snapshot = url.searchParams.get("snapshot") === "true";

    const [result, platformSnapshot, accounts] = await Promise.all([
      financeService.searchTransactions(parsed, context),
      snapshot ? buildFinancePlatformSnapshot(context) : Promise.resolve(null),
      snapshot ? financeService.listAccounts(context) : Promise.resolve([]),
    ]);

    if (snapshot && platformSnapshot) {
      return jsonSuccess({
        ...platformSnapshot,
        context,
        accounts,
        transactions: result.transactions,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    }

    return jsonSuccess(result);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetFinanceInvoice(_request: Request, invoiceId: string) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_READ });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const invoice = await financeService.getInvoiceById(context, invoiceId);

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    return jsonSuccess(invoice);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateFinanceInvoice(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = createFinanceInvoiceSchema.parse(await request.json());
    const invoice = await financeService.createInvoice(context, body);
    return jsonSuccess(invoice, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateFinanceAccount(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = createFinanceAccountSchema.parse(await request.json());
    const account = await financeService.createAccount(context, body);
    return jsonSuccess(account, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateFinanceAccount(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_UPDATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = updateFinanceAccountSchema.parse(await request.json());
    const account = await financeService.updateAccount(context, body);

    if (!account) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    return jsonSuccess(account);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateJournalEntry(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = createJournalEntrySchema.parse(await request.json());
    const entry = await financeService.createJournalEntry(context, body);
    return jsonSuccess(entry, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateJournalEntry(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_UPDATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = updateJournalEntrySchema.parse(await request.json());
    const entry = await financeService.updateJournalEntry(context, body);

    if (!entry) {
      return NextResponse.json(
        { success: false, error: "Journal entry not found or already posted" },
        { status: 404 },
      );
    }

    return jsonSuccess(entry);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleDeleteJournalEntry(_request: Request, journalEntryId: string) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_DELETE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const deleted = await financeService.deleteJournalEntry(context, journalEntryId);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Journal entry not found" }, { status: 404 });
    }

    return jsonSuccess({ deleted: true });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRestoreJournalEntry(_request: Request, journalEntryId: string) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_UPDATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const restored = await financeService.restoreJournalEntry(context, journalEntryId);

    if (!restored) {
      return NextResponse.json({ success: false, error: "Journal entry not found" }, { status: 404 });
    }

    return jsonSuccess({ restored: true });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRecordFinanceExpense(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = recordFinanceExpenseSchema.parse(await request.json());
    const record = await financeService.recordExpense(context, body);
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRecordFinancePayment(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = recordFinancePaymentSchema.parse(await request.json());
    const record = await financeService.recordPayment(context, {
      ...body,
      recordedByUserId: context.userId,
    });
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateCostCenter(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = createCostCenterSchema.parse(await request.json());
    const costCenter = await financeService.createCostCenter(context, body);
    return jsonSuccess(costCenter, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateBudget(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = createBudgetSchema.parse(await request.json());
    const budget = await financeService.createBudget(context, body);
    return jsonSuccess(budget, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateFinanceTax(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_CREATE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = createFinanceTaxSchema.parse(await request.json());
    const tax = await financeService.createTaxRecord(context, body);
    return jsonSuccess(tax, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBulkFinanceAction(request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_APPROVE });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const body = financeBulkActionSchema.parse(await request.json());
    const affected = await financeService.bulkAction(context, body);
    return jsonSuccess({ affected });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleFinanceReports(_request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_READ });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const record = await financeService.getRecord(context);
    return jsonSuccess({
      profitAndLoss: record.profitAndLoss,
      balanceSheet: record.balanceSheet,
      cashFlow: record.cashFlow,
      trialBalance: record.ledgers,
      journalEntries: record.journalEntries,
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleFinanceAlerts(_request: Request) {
  try {
    const platform = await protectedFinanceRoute({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_READ });
    const context = toFinancePlatformContext(resolveFinanceScope(platform));
    const [overdue, unpaid] = await Promise.all([
      financeService.getOverdueInvoices(context),
      financeService.getUnpaidInvoices(context),
    ]);
    return jsonSuccess({ overdue, unpaid });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export { journalEntryActionSchema };
