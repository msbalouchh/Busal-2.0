"use server";

import { z } from "zod";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import type {
  ReportingExportFormat,
  ReportingExportReportType,
} from "@/modules/reporting/constants/routes";
import { logReportingAudit } from "@/modules/reporting/utils/reporting-audit";
import { generateFinancialReportPdf } from "@/modules/reporting/utils/export/report-export";
import {
  formatReportingMoney,
  rowsToCsv,
  rowsToExcel,
} from "@/modules/reporting/utils/reporting-utils";
import {
  getCustomerAnalytics,
  getFinancialReport,
  getInventoryAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getSalesDashboard,
  getStaffAnalytics,
} from "@/services/reporting.service";

const exportReportSchema = z.object({
  reportType: z.enum([
    "sales",
    "orders",
    "products",
    "customers",
    "inventory",
    "staff",
    "financial",
  ]),
  format: z.enum(["csv", "excel", "pdf"]),
});

interface ExportPayload {
  filename: string;
  mimeType: string;
  contentBase64: string;
}

function toBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

async function buildReportRows(
  businessId: string,
  reportType: ReportingExportReportType,
  branchId: string | null,
): Promise<{ headers: string[]; rows: string[][]; title: string }> {
  switch (reportType) {
    case "sales": {
      const sales = await getSalesDashboard(businessId, branchId);
      return {
        title: "Sales Report",
        headers: ["Metric", "Value"],
        rows: [
          ["Today's Sales", formatReportingMoney(sales.periods.today.netRevenuePence)],
          ["Weekly Sales", formatReportingMoney(sales.periods.week.netRevenuePence)],
          ["Monthly Sales", formatReportingMoney(sales.periods.month.netRevenuePence)],
          ["Yearly Sales", formatReportingMoney(sales.periods.year.netRevenuePence)],
          ["Gross Revenue (Today)", formatReportingMoney(sales.grossRevenuePence)],
          ["Net Revenue (Today)", formatReportingMoney(sales.netRevenuePence)],
          ["Average Order Value", formatReportingMoney(sales.averageOrderValuePence)],
          ["Total Orders (Today)", String(sales.totalOrders)],
        ],
      };
    }
    case "orders": {
      const analytics = await getOrderAnalytics(businessId, undefined, branchId);
      return {
        title: "Order Analytics",
        headers: ["Metric", "Value"],
        rows: [
          ["Cancelled Orders", String(analytics.cancelledOrders)],
          ["Refunds", formatReportingMoney(analytics.refundsPence)],
          ["Refund Count", String(analytics.refundCount)],
          ...analytics.ordersByPaymentMethod.map((entry) => [
            `Payments (${entry.method})`,
            `${entry.count} · ${formatReportingMoney(entry.totalPence)}`,
          ]),
        ],
      };
    }
    case "products": {
      const analytics = await getProductAnalytics(businessId, undefined, branchId);
      return {
        title: "Product Analytics",
        headers: ["Item", "Category", "Quantity", "Revenue"],
        rows: analytics.bestSelling.map((item) => [
          item.name,
          item.categoryName ?? "—",
          String(item.quantitySold),
          formatReportingMoney(item.revenuePence),
        ]),
      };
    }
    case "customers": {
      const analytics = await getCustomerAnalytics(businessId, undefined, branchId);
      return {
        title: "Customer Analytics",
        headers: ["Customer", "Total Spent"],
        rows: analytics.topSpendingCustomers.map((customer) => [
          customer.name,
          formatReportingMoney(customer.totalSpentPence),
        ]),
      };
    }
    case "inventory": {
      const analytics = await getInventoryAnalytics(businessId, branchId);
      return {
        title: "Inventory Analytics",
        headers: ["Metric", "Value"],
        rows: [
          ["Low Stock", String(analytics.lowStockCount)],
          ["Out of Stock", String(analytics.outOfStockCount)],
          ["Stock Valuation", formatReportingMoney(analytics.stockValuationPence)],
        ],
      };
    }
    case "staff": {
      const staff = await getStaffAnalytics(businessId, undefined, branchId);
      return {
        title: "Staff Analytics",
        headers: ["Staff", "Orders", "Sales", "Avg Processing (min)"],
        rows: staff.map((entry) => [
          entry.staffName,
          String(entry.ordersHandled),
          formatReportingMoney(entry.salesProcessedPence),
          entry.averageProcessingMinutes === null ? "—" : String(entry.averageProcessingMinutes),
        ]),
      };
    }
    case "financial": {
      const report = await getFinancialReport(businessId, "monthly", branchId);
      return {
        title: "Financial Report",
        headers: ["Metric", "Value"],
        rows: [
          ["Gross Revenue", formatReportingMoney(report.grossRevenuePence)],
          ["Net Revenue", formatReportingMoney(report.netRevenuePence)],
          ["Tax", formatReportingMoney(report.taxPence)],
          ["Discounts", formatReportingMoney(report.discountPence)],
          ["Total Orders", String(report.totalOrders)],
          ...report.paymentMethodSummary.map((entry) => [
            `Payment (${entry.method})`,
            `${entry.count} · ${formatReportingMoney(entry.totalPence)}`,
          ]),
        ],
      };
    }
  }
}

async function buildExportPayload(
  businessId: string,
  reportType: ReportingExportReportType,
  format: ReportingExportFormat,
  branchId: string | null,
): Promise<ExportPayload> {
  const { headers, rows, title } = await buildReportRows(businessId, reportType, branchId);
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    if (reportType === "financial") {
      const report = await getFinancialReport(businessId, "monthly", branchId);
      const buffer = await generateFinancialReportPdf({
        period: report.period,
        from: report.from,
        to: report.to,
        grossRevenuePence: report.grossRevenuePence,
        netRevenuePence: report.netRevenuePence,
        taxPence: report.taxPence,
        discountPence: report.discountPence,
        totalOrders: report.totalOrders,
        paymentMethodSummary: report.paymentMethodSummary.map((entry) => ({
          method: entry.method,
          count: entry.count,
          totalPence: entry.totalPence,
        })),
      });

      return {
        filename: `${reportType}-${timestamp}.pdf`,
        mimeType: "application/pdf",
        contentBase64: toBase64(buffer),
      };
    }

    const { generateReportPdf } = await import("@/modules/reporting/utils/export/report-export");
    const buffer = await generateReportPdf(title, [
      {
        title: "Report Data",
        rows: rows.map(([label, value]) => ({ label: label ?? "", value: value ?? "" })),
      },
    ]);

    return {
      filename: `${reportType}-${timestamp}.pdf`,
      mimeType: "application/pdf",
      contentBase64: toBase64(buffer),
    };
  }

  if (format === "excel") {
    const buffer = rowsToExcel(headers, rows);

    return {
      filename: `${reportType}-${timestamp}.xls`,
      mimeType: "application/vnd.ms-excel",
      contentBase64: toBase64(buffer),
    };
  }

  const csv = rowsToCsv(headers, rows);

  return {
    filename: `${reportType}-${timestamp}.csv`,
    mimeType: "text/csv",
    contentBase64: toBase64(Buffer.from(csv, "utf8")),
  };
}

export async function exportReportAction(input: z.infer<typeof exportReportSchema>) {
  return protectedAction(PERMISSION_CODES.ANALYTICS_VIEW, async ({ business, platform }) => {
    const parsed = exportReportSchema.parse(input);
    const payload = await buildExportPayload(
      business.id,
      parsed.reportType,
      parsed.format,
      platform.branchId,
    );

    await logReportingAudit(business.id, {
      staffId: platform.staffSession?.staffId ?? null,
      entityType: "report_export",
      entityId: parsed.reportType,
      action: "EXPORT",
      metadata: {
        format: parsed.format,
        filename: payload.filename,
      },
    });

    return {
      success: true as const,
      data: payload,
    };
  });
}
