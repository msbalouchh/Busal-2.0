import "server-only";

export type DocumentExportFormat = "PDF" | "DOCX" | "XLSX" | "CSV" | "HTML" | "JSON";

export interface DocumentExportResult {
  format: DocumentExportFormat;
  simulated: boolean;
  content: string;
  mimeType: string;
  filename: string;
}

function parseDocumentBody(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

function toCsvRow(values: string[]): string {
  return values.map((value) => `"${value.replace(/"/g, '""')}"`).join(",");
}

export async function exportDocument(
  document: { name: string; slug: string; metadata: unknown },
  format: DocumentExportFormat,
): Promise<DocumentExportResult> {
  const metadata = parseDocumentBody(document.metadata);
  const body = metadata.content ?? metadata.body ?? metadata.text ?? document.name;
  const title = String(metadata.title ?? document.name);

  const mimeTypes: Record<DocumentExportFormat, string> = {
    PDF: "application/pdf",
    DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    CSV: "text/csv",
    HTML: "text/html",
    JSON: "application/json",
  };

  switch (format) {
    case "JSON":
      return {
        format,
        simulated: false,
        content: JSON.stringify({ name: document.name, slug: document.slug, ...metadata }, null, 2),
        mimeType: mimeTypes.JSON,
        filename: `${document.slug}.json`,
      };
    case "HTML":
      return {
        format,
        simulated: false,
        content: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1><pre>${String(body)}</pre></body></html>`,
        mimeType: mimeTypes.HTML,
        filename: `${document.slug}.html`,
      };
    case "CSV":
      return {
        format,
        simulated: false,
        content: `${toCsvRow(["field", "value"])}\n${toCsvRow(["name", document.name])}\n${toCsvRow(["content", String(body)])}`,
        mimeType: mimeTypes.CSV,
        filename: `${document.slug}.csv`,
      };
    case "PDF":
    case "DOCX":
    case "XLSX":
      return {
        format,
        simulated: true,
        content: String(body),
        mimeType: "text/plain",
        filename: `${document.slug}.txt`,
      };
    default:
      return {
        format,
        simulated: false,
        content: String(body),
        mimeType: "text/plain",
        filename: `${document.slug}.txt`,
      };
  }
}

export const SUPPORTED_EXPORT_FORMATS: DocumentExportFormat[] = [
  "PDF",
  "DOCX",
  "XLSX",
  "CSV",
  "HTML",
  "JSON",
];
