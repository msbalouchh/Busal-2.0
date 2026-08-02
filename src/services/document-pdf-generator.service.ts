import "server-only";

export interface PdfGenerationResult {
  simulated: boolean;
  pdfReference: string;
  message: string;
}

export async function generatePdf(content: string, title: string): Promise<PdfGenerationResult> {
  void content;
  return {
    simulated: true,
    pdfReference: `pdf_sim_${title.replace(/\s+/g, "-").toLowerCase()}`,
    message: "PDF generation simulated — no external renderer configured",
  };
}

export interface DocumentGeneratorResult {
  documentType: string;
  content: string;
  variables: Record<string, string>;
}

const GENERATOR_TEMPLATES = {
  invoice: '{"type":"invoice","number":"{{number}}","customer":"{{customer}}","total":"{{total}}"}',
  receipt: '{"type":"receipt","orderId":"{{orderId}}","amount":"{{amount}}"}',
  quotation: '{"type":"quote","quoteNumber":"{{number}}","validUntil":"{{validUntil}}"}',
  purchase_order: '{"type":"purchase_order","poNumber":"{{number}}","supplier":"{{supplier}}"}',
  report: '{"type":"report","title":"{{title}}","period":"{{period}}"}',
  certificate: '{"type":"certificate","recipient":"{{recipient}}","course":"{{course}}"}',
} as const;

function renderGeneratorTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
}

export function generateInvoiceContent(variables: Record<string, string>): DocumentGeneratorResult {
  return {
    documentType: "INVOICE",
    content: renderGeneratorTemplate(GENERATOR_TEMPLATES.invoice, variables),
    variables,
  };
}

export function generateReceiptContent(variables: Record<string, string>): DocumentGeneratorResult {
  return {
    documentType: "RECEIPT",
    content: renderGeneratorTemplate(GENERATOR_TEMPLATES.receipt, variables),
    variables,
  };
}

export function generateQuotationContent(
  variables: Record<string, string>,
): DocumentGeneratorResult {
  return {
    documentType: "QUOTE",
    content: renderGeneratorTemplate(GENERATOR_TEMPLATES.quotation, variables),
    variables,
  };
}

export function generatePurchaseOrderContent(
  variables: Record<string, string>,
): DocumentGeneratorResult {
  return {
    documentType: "PURCHASE_ORDER",
    content: renderGeneratorTemplate(GENERATOR_TEMPLATES.purchase_order, variables),
    variables,
  };
}

export function generateReportContent(variables: Record<string, string>): DocumentGeneratorResult {
  return {
    documentType: "REPORT",
    content: renderGeneratorTemplate(GENERATOR_TEMPLATES.report, variables),
    variables,
  };
}

export function generateCertificateContent(
  variables: Record<string, string>,
): DocumentGeneratorResult {
  return {
    documentType: "CERTIFICATE",
    content: renderGeneratorTemplate(GENERATOR_TEMPLATES.certificate, variables),
    variables,
  };
}
