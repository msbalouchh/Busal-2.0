import "server-only";

import type { Prisma, RevenueInvoiceSourceType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logRevopsAudit } from "@/modules/revops/utils/revops-audit";

const DEFAULT_INVOICE_DUE_DAYS = 30;

export interface RevenueInvoiceData {
  id: string;
  businessId: string;
  invoiceNumber: string;
  status: string;
  sourceType: string;
  customerId: string | null;
  customerName: string | null;
  contractId: string | null;
  implementationProjectId: string | null;
  milestoneId: string | null;
  industry: string | null;
  serviceType: string | null;
  currency: string;
  subtotalPence: number;
  taxPence: number;
  totalPence: number;
  amountPaidPence: number;
  issuedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPricePence: number;
    totalPence: number;
  }>;
  payments: Array<{
    id: string;
    amountPence: number;
    paymentMethod: string;
    status: string;
    paidAt: Date | null;
  }>;
}

export interface RevopsDashboardData {
  totalInvoicedPence: number;
  totalCollectedPence: number;
  outstandingPence: number;
  overdueInvoices: number;
  recognizedRevenuePence: number;
  totalExpensesPence: number;
  netProfitPence: number;
  openCollections: number;
}

export interface ProfitabilitySlice {
  key: string;
  label: string;
  revenuePence: number;
  expensePence: number;
  profitPence: number;
}

export interface RevenueForecastData {
  month: string;
  activeContractsPence: number;
  renewalsPence: number;
  pipelinePence: number;
  totalProjectedPence: number;
}

export interface RevenueAnalyticsData {
  invoicesByStatus: Array<{ status: string; count: number; totalPence: number }>;
  paymentsByMethod: Array<{ method: string; count: number; totalPence: number }>;
  revenueBySource: Array<{ sourceType: string; totalPence: number }>;
  profitabilityByCustomer: ProfitabilitySlice[];
  profitabilityByProject: ProfitabilitySlice[];
  profitabilityByService: ProfitabilitySlice[];
  profitabilityByIndustry: ProfitabilitySlice[];
}

async function nextInvoiceNumber(
  businessId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<string> {
  const count = await tx.revenueInvoice.count({ where: { businessId } });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

async function loadInvoice(invoiceId: string, businessId: string): Promise<RevenueInvoiceData> {
  const invoice = await prisma.revenueInvoice.findFirst({
    where: { id: invoiceId, businessId },
    include: {
      customer: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  return {
    id: invoice.id,
    businessId: invoice.businessId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    sourceType: invoice.sourceType,
    customerId: invoice.customerId,
    customerName: invoice.customer?.name ?? null,
    contractId: invoice.contractId,
    implementationProjectId: invoice.implementationProjectId,
    milestoneId: invoice.milestoneId,
    industry: invoice.industry,
    serviceType: invoice.serviceType,
    currency: invoice.currency,
    subtotalPence: invoice.subtotalPence,
    taxPence: invoice.taxPence,
    totalPence: invoice.totalPence,
    amountPaidPence: invoice.amountPaidPence,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    paidAt: invoice.paidAt,
    lineItems: invoice.lineItems.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: line.quantity,
      unitPricePence: line.unitPricePence,
      totalPence: line.totalPence,
    })),
    payments: invoice.payments.map((payment) => ({
      id: payment.id,
      amountPence: payment.amountPence,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      paidAt: payment.paidAt,
    })),
  };
}

async function createInvoiceRecord(
  businessId: string,
  staffId: string | null,
  input: {
    sourceType: RevenueInvoiceSourceType;
    customerId?: string | null;
    contractId?: string | null;
    implementationProjectId?: string | null;
    milestoneId?: string | null;
    industry?: string | null;
    serviceType?: string | null;
    lineItems: Array<{ description: string; quantity: number; unitPricePence: number }>;
    notes?: string | null;
  },
  tx: Prisma.TransactionClient = prisma,
): Promise<string> {
  const subtotalPence = input.lineItems.reduce(
    (sum, line) => sum + line.unitPricePence * line.quantity,
    0,
  );
  const taxPence = Math.round(subtotalPence * 0.2);
  const totalPence = subtotalPence + taxPence;
  const invoiceNumber = await nextInvoiceNumber(businessId, tx);

  const invoice = await tx.revenueInvoice.create({
    data: {
      businessId,
      invoiceNumber,
      sourceType: input.sourceType,
      customerId: input.customerId ?? null,
      contractId: input.contractId ?? null,
      implementationProjectId: input.implementationProjectId ?? null,
      milestoneId: input.milestoneId ?? null,
      industry: input.industry ?? null,
      serviceType: input.serviceType ?? null,
      subtotalPence,
      taxPence,
      totalPence,
      notes: input.notes ?? null,
      lineItems: {
        create: input.lineItems.map((line, index) => ({
          description: line.description,
          quantity: line.quantity,
          unitPricePence: line.unitPricePence,
          totalPence: line.unitPricePence * line.quantity,
          sortOrder: index,
        })),
      },
    },
  });

  await logRevopsAudit(
    businessId,
    {
      staffId,
      entityType: "revenue_invoice",
      entityId: invoice.id,
      action: "created",
      metadata: { sourceType: input.sourceType },
    },
    tx,
  );

  return invoice.id;
}

export async function generateInvoiceFromContract(
  contractId: string,
  businessId: string,
  staffId: string | null,
  tx?: Prisma.TransactionClient,
): Promise<string> {
  const db = tx ?? prisma;
  const contract = await db.contract.findFirst({
    where: { id: contractId, businessId, deletedAt: null },
    include: {
      currentVersion: {
        include: { lineItems: { include: { productVersion: true, bundleVersion: true } } },
      },
      opportunity: { include: { company: true } },
      activation: true,
    },
  });

  if (!contract?.currentVersion) {
    throw new Error("Contract not found");
  }

  const existing = await db.revenueInvoice.findFirst({
    where: { contractId, sourceType: "CONTRACT", businessId },
  });
  if (existing) {
    return existing.id;
  }

  const lineItems = contract.currentVersion.lineItems.map((line) => ({
    description:
      line.customName ??
      line.productVersion?.name ??
      line.bundleVersion?.name ??
      "Contract line item",
    quantity: line.quantity,
    unitPricePence: line.unitPricePence,
  }));

  return createInvoiceRecord(
    businessId,
    staffId,
    {
      sourceType: "CONTRACT",
      customerId: contract.activation?.customerId ?? null,
      contractId: contract.id,
      industry: contract.opportunity.company?.industry ?? null,
      serviceType: "contract",
      lineItems,
      notes: `Generated from contract ${contract.contractNumber}`,
    },
    tx,
  );
}

export async function generateInvoiceFromImplementationProject(
  projectId: string,
  businessId: string,
  staffId: string | null,
): Promise<string> {
  const project = await prisma.implementationProject.findFirst({
    where: { id: projectId, businessId },
    include: { contract: { include: { currentVersion: { include: { lineItems: true } } } } },
  });
  if (!project) {
    throw new Error("Implementation project not found");
  }

  const existing = await prisma.revenueInvoice.findFirst({
    where: { implementationProjectId: projectId, sourceType: "IMPLEMENTATION_PROJECT", businessId },
  });
  if (existing) {
    return existing.id;
  }

  const lineItems = project.contract.currentVersion?.lineItems.map((line) => ({
    description: `Implementation — ${project.name}`,
    quantity: 1,
    unitPricePence: Math.round(line.unitPricePence * line.quantity * 0.25),
  })) ?? [{ description: `Implementation — ${project.name}`, quantity: 1, unitPricePence: 0 }];

  return createInvoiceRecord(businessId, staffId, {
    sourceType: "IMPLEMENTATION_PROJECT",
    customerId: project.customerId,
    contractId: project.contractId,
    implementationProjectId: project.id,
    industry: project.industry,
    serviceType: "implementation",
    lineItems,
  });
}

export async function generateInvoiceFromMilestone(
  milestoneId: string,
  businessId: string,
  staffId: string | null,
): Promise<string> {
  const milestone = await prisma.implementationMilestone.findFirst({
    where: { id: milestoneId, project: { businessId } },
    include: { project: true },
  });
  if (!milestone) {
    throw new Error("Milestone not found");
  }

  const existing = await prisma.revenueInvoice.findFirst({
    where: { milestoneId, businessId },
  });
  if (existing) {
    return existing.id;
  }

  return createInvoiceRecord(businessId, staffId, {
    sourceType: "MILESTONE",
    customerId: milestone.project.customerId,
    contractId: milestone.project.contractId,
    implementationProjectId: milestone.projectId,
    milestoneId: milestone.id,
    industry: milestone.project.industry,
    serviceType: "milestone",
    lineItems: [
      {
        description: `Milestone completed — ${milestone.name}`,
        quantity: 1,
        unitPricePence: 25000,
      },
    ],
  });
}

export async function generateInvoiceFromService(
  businessId: string,
  staffId: string | null,
  input: {
    sourceType: "MANAGED_SERVICE" | "PROFESSIONAL_SERVICE";
    customerId?: string | null;
    contractId?: string | null;
    industry?: string | null;
    serviceType: string;
    description: string;
    amountPence: number;
  },
): Promise<string> {
  return createInvoiceRecord(businessId, staffId, {
    sourceType: input.sourceType,
    customerId: input.customerId ?? null,
    contractId: input.contractId ?? null,
    industry: input.industry ?? null,
    serviceType: input.serviceType,
    lineItems: [{ description: input.description, quantity: 1, unitPricePence: input.amountPence }],
  });
}

export async function issueInvoice(
  invoiceId: string,
  businessId: string,
  staffId: string | null,
  dueAt?: Date | null,
): Promise<RevenueInvoiceData> {
  const dueDate = dueAt ?? new Date(Date.now() + DEFAULT_INVOICE_DUE_DAYS * 86400000);

  await prisma.revenueInvoice.updateMany({
    where: { id: invoiceId, businessId, status: "DRAFT" },
    data: { status: "ISSUED", issuedAt: new Date(), dueAt: dueDate },
  });

  await logRevopsAudit(businessId, {
    staffId,
    entityType: "revenue_invoice",
    entityId: invoiceId,
    action: "issued",
  });

  return loadInvoice(invoiceId, businessId);
}

export async function recordInvoicePayment(
  invoiceId: string,
  businessId: string,
  staffId: string | null,
  input: {
    amountPence: number;
    paymentMethod: "STRIPE" | "GOCARDLESS" | "BANK_TRANSFER" | "PAYPAL" | "MANUAL";
    providerReference?: string | null;
    paidAt?: Date | null;
  },
): Promise<RevenueInvoiceData> {
  const invoice = await prisma.revenueInvoice.findFirst({ where: { id: invoiceId, businessId } });
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const paidAt = input.paidAt ?? new Date();

  await prisma.$transaction(async (tx) => {
    await tx.revenueInvoicePayment.create({
      data: {
        invoiceId,
        amountPence: input.amountPence,
        paymentMethod: input.paymentMethod,
        status: "COMPLETED",
        providerReference: input.providerReference ?? null,
        recordedByStaffId: staffId,
        paidAt,
      },
    });

    const amountPaidPence = invoice.amountPaidPence + input.amountPence;
    const status =
      amountPaidPence >= invoice.totalPence
        ? "PAID"
        : amountPaidPence > 0
          ? "PARTIALLY_PAID"
          : invoice.status;

    await tx.revenueInvoice.update({
      where: { id: invoiceId },
      data: {
        amountPaidPence,
        status,
        paidAt: status === "PAID" ? paidAt : invoice.paidAt,
      },
    });

    await logRevopsAudit(
      businessId,
      {
        staffId,
        entityType: "revenue_invoice_payment",
        entityId: invoiceId,
        action: "recorded",
        metadata: { paymentMethod: input.paymentMethod, amountPence: input.amountPence },
      },
      tx,
    );
  });

  return loadInvoice(invoiceId, businessId);
}

export async function recognizeRevenue(
  invoiceId: string,
  businessId: string,
  staffId: string | null,
  input?: { periodStart?: Date; periodEnd?: Date },
): Promise<void> {
  const invoice = await prisma.revenueInvoice.findFirst({ where: { id: invoiceId, businessId } });
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const periodStart = input?.periodStart ?? invoice.issuedAt ?? new Date();
  const periodEnd = input?.periodEnd ?? new Date();

  await prisma.revenueRecognitionEntry.create({
    data: {
      invoiceId,
      amountPence: invoice.totalPence,
      status: "RECOGNIZED",
      periodStart,
      periodEnd,
      recognizedAt: new Date(),
    },
  });

  await logRevopsAudit(businessId, {
    staffId,
    entityType: "revenue_recognition",
    entityId: invoiceId,
    action: "recognized",
  });
}

export async function createRevenueExpense(
  businessId: string,
  staffId: string | null,
  input: {
    category?: "DELIVERY" | "SUPPORT" | "INFRASTRUCTURE" | "SALES" | "MARKETING" | "OTHER";
    description: string;
    amountPence: number;
    incurredAt?: Date;
    customerId?: string | null;
    implementationProjectId?: string | null;
    industry?: string | null;
    serviceType?: string | null;
  },
): Promise<void> {
  await prisma.revenueExpense.create({
    data: {
      businessId,
      category: input.category ?? "OTHER",
      description: input.description.trim(),
      amountPence: input.amountPence,
      incurredAt: input.incurredAt ?? new Date(),
      customerId: input.customerId ?? null,
      implementationProjectId: input.implementationProjectId ?? null,
      industry: input.industry ?? null,
      serviceType: input.serviceType ?? null,
    },
  });

  await logRevopsAudit(businessId, {
    staffId,
    entityType: "revenue_expense",
    entityId: businessId,
    action: "created",
  });
}

export async function createCollectionCase(
  invoiceId: string,
  businessId: string,
  staffId: string | null,
  input?: { notes?: string | null; nextFollowUpAt?: Date | null },
): Promise<void> {
  const invoice = await prisma.revenueInvoice.findFirst({ where: { id: invoiceId, businessId } });
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  await prisma.revenueCollectionCase.create({
    data: {
      invoiceId,
      status: "OPEN",
      notes: input?.notes ?? null,
      nextFollowUpAt: input?.nextFollowUpAt ?? null,
    },
  });

  await prisma.revenueInvoice.updateMany({
    where: { id: invoiceId },
    data: { status: "OVERDUE" },
  });

  await logRevopsAudit(businessId, {
    staffId,
    entityType: "revenue_collection",
    entityId: invoiceId,
    action: "opened",
  });
}

export async function listRevenueInvoices(businessId: string): Promise<RevenueInvoiceData[]> {
  const invoices = await prisma.revenueInvoice.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(invoices.map((invoice) => loadInvoice(invoice.id, businessId)));
}

export async function getRevenueInvoice(
  invoiceId: string,
  businessId: string,
): Promise<RevenueInvoiceData> {
  return loadInvoice(invoiceId, businessId);
}

export async function listRevenuePayments(businessId: string) {
  const payments = await prisma.revenueInvoicePayment.findMany({
    where: { invoice: { businessId } },
    include: { invoice: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });

  return payments.map((payment) => ({
    id: payment.id,
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoice.invoiceNumber,
    customerName: payment.invoice.customer?.name ?? null,
    amountPence: payment.amountPence,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    paidAt: payment.paidAt,
  }));
}

export async function listRevenueRecognition(businessId: string) {
  const entries = await prisma.revenueRecognitionEntry.findMany({
    where: { invoice: { businessId } },
    include: { invoice: true },
    orderBy: { createdAt: "desc" },
  });

  return entries.map((entry) => ({
    id: entry.id,
    invoiceId: entry.invoiceId,
    invoiceNumber: entry.invoice.invoiceNumber,
    amountPence: entry.amountPence,
    status: entry.status,
    periodStart: entry.periodStart,
    periodEnd: entry.periodEnd,
    recognizedAt: entry.recognizedAt,
  }));
}

export async function listRevenueExpenses(businessId: string) {
  const expenses = await prisma.revenueExpense.findMany({
    where: { businessId },
    orderBy: { incurredAt: "desc" },
  });

  return expenses.map((expense) => ({
    id: expense.id,
    category: expense.category,
    description: expense.description,
    amountPence: expense.amountPence,
    incurredAt: expense.incurredAt,
    industry: expense.industry,
    serviceType: expense.serviceType,
  }));
}

export async function listCollectionCases(businessId: string) {
  const cases = await prisma.revenueCollectionCase.findMany({
    where: { invoice: { businessId } },
    include: { invoice: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });

  return cases.map((collectionCase) => ({
    id: collectionCase.id,
    invoiceId: collectionCase.invoiceId,
    invoiceNumber: collectionCase.invoice.invoiceNumber,
    customerName: collectionCase.invoice.customer?.name ?? null,
    status: collectionCase.status,
    nextFollowUpAt: collectionCase.nextFollowUpAt,
    outstandingPence: collectionCase.invoice.totalPence - collectionCase.invoice.amountPaidPence,
  }));
}

function buildProfitabilitySlices(
  revenueMap: Map<string, { label: string; revenuePence: number }>,
  expenseMap: Map<string, { label: string; expensePence: number }>,
): ProfitabilitySlice[] {
  const keys = new Set([...revenueMap.keys(), ...expenseMap.keys()]);
  return [...keys].map((key) => {
    const revenue = revenueMap.get(key)?.revenuePence ?? 0;
    const expense = expenseMap.get(key)?.expensePence ?? 0;
    return {
      key,
      label: revenueMap.get(key)?.label ?? expenseMap.get(key)?.label ?? key,
      revenuePence: revenue,
      expensePence: expense,
      profitPence: revenue - expense,
    };
  });
}

export async function getProfitabilityReport(businessId: string): Promise<{
  byCustomer: ProfitabilitySlice[];
  byProject: ProfitabilitySlice[];
  byService: ProfitabilitySlice[];
  byIndustry: ProfitabilitySlice[];
}> {
  const [invoices, expenses] = await Promise.all([
    prisma.revenueInvoice.findMany({
      where: { businessId },
      include: { customer: true },
    }),
    prisma.revenueExpense.findMany({ where: { businessId } }),
  ]);

  const byCustomer = new Map<string, { label: string; revenuePence: number }>();
  const byProject = new Map<string, { label: string; revenuePence: number }>();
  const byService = new Map<string, { label: string; revenuePence: number }>();
  const byIndustry = new Map<string, { label: string; revenuePence: number }>();
  const expenseByCustomer = new Map<string, { label: string; expensePence: number }>();
  const expenseByProject = new Map<string, { label: string; expensePence: number }>();
  const expenseByService = new Map<string, { label: string; expensePence: number }>();
  const expenseByIndustry = new Map<string, { label: string; expensePence: number }>();

  for (const invoice of invoices) {
    if (invoice.customerId) {
      const existing = byCustomer.get(invoice.customerId) ?? {
        label: invoice.customer?.name ?? invoice.customerId,
        revenuePence: 0,
      };
      existing.revenuePence += invoice.amountPaidPence;
      byCustomer.set(invoice.customerId, existing);
    }
    if (invoice.implementationProjectId) {
      const existing = byProject.get(invoice.implementationProjectId) ?? {
        label: invoice.implementationProjectId,
        revenuePence: 0,
      };
      existing.revenuePence += invoice.amountPaidPence;
      byProject.set(invoice.implementationProjectId, existing);
    }
    const serviceKey = invoice.serviceType ?? invoice.sourceType;
    const serviceExisting = byService.get(serviceKey) ?? { label: serviceKey, revenuePence: 0 };
    serviceExisting.revenuePence += invoice.amountPaidPence;
    byService.set(serviceKey, serviceExisting);
    const industryKey = invoice.industry ?? "unknown";
    const industryExisting = byIndustry.get(industryKey) ?? {
      label: industryKey,
      revenuePence: 0,
    };
    industryExisting.revenuePence += invoice.amountPaidPence;
    byIndustry.set(industryKey, industryExisting);
  }

  for (const expense of expenses) {
    if (expense.customerId) {
      const existing = expenseByCustomer.get(expense.customerId) ?? {
        label: expense.customerId,
        expensePence: 0,
      };
      existing.expensePence += expense.amountPence;
      expenseByCustomer.set(expense.customerId, existing);
    }
    if (expense.implementationProjectId) {
      const existing = expenseByProject.get(expense.implementationProjectId) ?? {
        label: expense.implementationProjectId,
        expensePence: 0,
      };
      existing.expensePence += expense.amountPence;
      expenseByProject.set(expense.implementationProjectId, existing);
    }
    const serviceKey = expense.serviceType ?? expense.category;
    const serviceExisting = expenseByService.get(serviceKey) ?? {
      label: serviceKey,
      expensePence: 0,
    };
    serviceExisting.expensePence += expense.amountPence;
    expenseByService.set(serviceKey, serviceExisting);
    const industryKey = expense.industry ?? "unknown";
    const industryExisting = expenseByIndustry.get(industryKey) ?? {
      label: industryKey,
      expensePence: 0,
    };
    industryExisting.expensePence += expense.amountPence;
    expenseByIndustry.set(industryKey, industryExisting);
  }

  return {
    byCustomer: buildProfitabilitySlices(byCustomer, expenseByCustomer),
    byProject: buildProfitabilitySlices(byProject, expenseByProject),
    byService: buildProfitabilitySlices(byService, expenseByService),
    byIndustry: buildProfitabilitySlices(byIndustry, expenseByIndustry),
  };
}

export async function generateRevenueForecast(businessId: string): Promise<RevenueForecastData[]> {
  const now = new Date();
  const months: RevenueForecastData[] = [];

  const [activeContracts, renewals, pipelineOpportunities] = await Promise.all([
    prisma.contract.findMany({
      where: { businessId, status: "ACTIVE", deletedAt: null },
      include: { currentVersion: true },
    }),
    prisma.customerRenewalRecord.findMany({
      where: { profile: { businessId }, status: { in: ["UPCOMING", "IN_PROGRESS"] } },
      include: { profile: { include: { contract: { include: { currentVersion: true } } } } },
    }),
    prisma.salesOpportunity.findMany({
      where: { businessId, deletedAt: null },
      include: { stage: true },
    }),
  ]);

  const openPipeline = pipelineOpportunities.filter(
    (opportunity) => !["won", "closed-won", "lost", "closed-lost"].includes(opportunity.stage.slug),
  );

  for (let index = 0; index < 6; index += 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + index, 1);
    const monthKey = monthDate.toISOString().slice(0, 7);

    const activeContractsPence = Math.round(
      activeContracts.reduce(
        (sum, contract) => sum + (contract.currentVersion?.totalPence ?? 0) / 12,
        0,
      ),
    );

    const renewalsPence = renewals
      .filter((renewal) => renewal.renewalDate.toISOString().slice(0, 7) === monthKey)
      .reduce(
        (sum, renewal) => sum + (renewal.profile.contract.currentVersion?.totalPence ?? 0),
        0,
      );

    const pipelinePence = Math.round(
      openPipeline.reduce((sum, opportunity) => sum + opportunity.valuePence, 0) / 6,
    );

    const totalProjectedPence = activeContractsPence + renewalsPence + pipelinePence;
    months.push({
      month: monthKey,
      activeContractsPence,
      renewalsPence,
      pipelinePence,
      totalProjectedPence,
    });

    await prisma.revenueForecastSnapshot.create({
      data: {
        businessId,
        forecastMonth: monthDate,
        source: "ACTIVE_CONTRACTS",
        projectedRevenuePence: activeContractsPence,
      },
    });
    if (renewalsPence > 0) {
      await prisma.revenueForecastSnapshot.create({
        data: {
          businessId,
          forecastMonth: monthDate,
          source: "RENEWALS",
          projectedRevenuePence: renewalsPence,
        },
      });
    }
    await prisma.revenueForecastSnapshot.create({
      data: {
        businessId,
        forecastMonth: monthDate,
        source: "SALES_PIPELINE",
        projectedRevenuePence: pipelinePence,
      },
    });
  }

  return months;
}

export async function getRevenueAnalytics(businessId: string): Promise<RevenueAnalyticsData> {
  const [invoices, payments, profitability] = await Promise.all([
    prisma.revenueInvoice.findMany({ where: { businessId } }),
    prisma.revenueInvoicePayment.findMany({
      where: { invoice: { businessId }, status: "COMPLETED" },
    }),
    getProfitabilityReport(businessId),
  ]);

  const statusMap = new Map<string, { count: number; totalPence: number }>();
  const sourceMap = new Map<string, number>();
  const methodMap = new Map<string, { count: number; totalPence: number }>();

  for (const invoice of invoices) {
    const existing = statusMap.get(invoice.status) ?? { count: 0, totalPence: 0 };
    existing.count += 1;
    existing.totalPence += invoice.totalPence;
    statusMap.set(invoice.status, existing);
    sourceMap.set(
      invoice.sourceType,
      (sourceMap.get(invoice.sourceType) ?? 0) + invoice.amountPaidPence,
    );
  }

  for (const payment of payments) {
    const existing = methodMap.get(payment.paymentMethod) ?? { count: 0, totalPence: 0 };
    existing.count += 1;
    existing.totalPence += payment.amountPence;
    methodMap.set(payment.paymentMethod, existing);
  }

  return {
    invoicesByStatus: [...statusMap.entries()].map(([status, data]) => ({
      status,
      ...data,
    })),
    paymentsByMethod: [...methodMap.entries()].map(([method, data]) => ({
      method,
      ...data,
    })),
    revenueBySource: [...sourceMap.entries()].map(([sourceType, totalPence]) => ({
      sourceType,
      totalPence,
    })),
    profitabilityByCustomer: profitability.byCustomer,
    profitabilityByProject: profitability.byProject,
    profitabilityByService: profitability.byService,
    profitabilityByIndustry: profitability.byIndustry,
  };
}

export async function getRevopsDashboard(businessId: string): Promise<RevopsDashboardData> {
  const [invoices, recognized, expenses, collections] = await Promise.all([
    prisma.revenueInvoice.findMany({ where: { businessId } }),
    prisma.revenueRecognitionEntry.findMany({
      where: { invoice: { businessId }, status: "RECOGNIZED" },
    }),
    prisma.revenueExpense.findMany({ where: { businessId } }),
    prisma.revenueCollectionCase.count({
      where: { invoice: { businessId }, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  const totalInvoicedPence = invoices.reduce((sum, invoice) => sum + invoice.totalPence, 0);
  const totalCollectedPence = invoices.reduce((sum, invoice) => sum + invoice.amountPaidPence, 0);
  const outstandingPence = totalInvoicedPence - totalCollectedPence;
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const recognizedRevenuePence = recognized.reduce((sum, entry) => sum + entry.amountPence, 0);
  const totalExpensesPence = expenses.reduce((sum, expense) => sum + expense.amountPence, 0);

  return {
    totalInvoicedPence,
    totalCollectedPence,
    outstandingPence,
    overdueInvoices,
    recognizedRevenuePence,
    totalExpensesPence,
    netProfitPence: totalCollectedPence - totalExpensesPence,
    openCollections: collections,
  };
}

export async function maybeGenerateMilestoneInvoice(
  milestoneId: string,
  businessId: string,
  staffId: string | null,
): Promise<string | null> {
  const milestone = await prisma.implementationMilestone.findFirst({
    where: { id: milestoneId, project: { businessId } },
    include: { tasks: true, project: true },
  });
  if (!milestone || milestone.tasks.length === 0) {
    return null;
  }

  const allComplete = milestone.tasks.every((task) => task.status === "COMPLETED");
  if (!allComplete) {
    return null;
  }

  await prisma.implementationMilestone.updateMany({
    where: { id: milestoneId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return generateInvoiceFromMilestone(milestoneId, businessId, staffId);
}

export const REVOPS_DEFAULT_INVOICE_DUE_DAYS = DEFAULT_INVOICE_DUE_DAYS;
