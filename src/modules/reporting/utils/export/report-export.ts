import "server-only";

import PDFDocument from "pdfkit";

import { formatReportingMoney } from "@/modules/reporting/utils/reporting-utils";
import type { FinancialReportView } from "@/modules/reporting/utils/reporting-utils";

interface ReportPdfSection {
  title: string;
  rows: Array<{ label: string; value: string }>;
}

export async function generateReportPdf(
  title: string,
  sections: ReportPdfSection[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).font("Helvetica-Bold").text(title);
    doc.moveDown();

    for (const section of sections) {
      doc.fontSize(14).font("Helvetica-Bold").text(section.title);
      doc.moveDown(0.3);

      for (const row of section.rows) {
        doc.fontSize(10).font("Helvetica").text(`${row.label}: ${row.value}`, { lineGap: 2 });
      }

      doc.moveDown();
    }

    doc.end();
  });
}

export async function generateFinancialReportPdf(report: FinancialReportView): Promise<Buffer> {
  return generateReportPdf("Financial Report", [
    {
      title: "Summary",
      rows: [
        { label: "Period", value: report.period },
        { label: "From", value: new Date(report.from).toLocaleString("en-GB") },
        { label: "To", value: new Date(report.to).toLocaleString("en-GB") },
        { label: "Gross Revenue", value: formatReportingMoney(report.grossRevenuePence) },
        { label: "Net Revenue", value: formatReportingMoney(report.netRevenuePence) },
        { label: "Tax", value: formatReportingMoney(report.taxPence) },
        { label: "Discounts", value: formatReportingMoney(report.discountPence) },
        { label: "Total Orders", value: String(report.totalOrders) },
      ],
    },
    {
      title: "Payment Methods",
      rows: report.paymentMethodSummary.map((entry) => ({
        label: entry.method,
        value: `${entry.count} payments · ${formatReportingMoney(entry.totalPence)}`,
      })),
    },
  ]);
}
