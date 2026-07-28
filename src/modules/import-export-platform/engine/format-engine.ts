import type { ImportExportFormat } from "@prisma/client";

import type { SchemaFieldDefinition } from "@/modules/import-export-platform/types/import-export-platform-types";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function escapeCsvValue(value: unknown): string {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function parseImportContent(
  format: ImportExportFormat,
  content: string,
): Array<Record<string, string>> {
  if (format === "JSON") {
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("JSON import must be an array of objects");
    }
    return parsed.map((row) => {
      const record: Record<string, string> = {};
      for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
        record[key] = String(value ?? "");
      }
      return record;
    });
  }

  const delimiter = format === "EXCEL" ? "\t" : ",";
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return [];
  }

  const headerLine = lines[0];
  if (!headerLine) {
    return [];
  }

  const headers = (delimiter === "\t" ? headerLine.split("\t") : parseCsvLine(headerLine)).map(
    (h) => h.trim(),
  );

  return lines.slice(1).map((line) => {
    const values = delimiter === "\t" ? line.split("\t") : parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    return row;
  });
}

export function serializeExportContent(
  format: ImportExportFormat,
  records: Array<Record<string, unknown>>,
  fields: SchemaFieldDefinition[],
): { content: string; mimeType: string; fileExtension: string } {
  const fieldKeys = fields.map((field) => field.key);

  if (format === "JSON") {
    return {
      content: JSON.stringify(records, null, 2),
      mimeType: "application/json",
      fileExtension: "json",
    };
  }

  if (format === "PDF") {
    const lines = records.map((record) =>
      fieldKeys.map((key) => `${key}: ${String(record[key] ?? "")}`).join(" | "),
    );
    return {
      content: lines.join("\n"),
      mimeType: "application/pdf",
      fileExtension: "pdf",
    };
  }

  const delimiter = format === "EXCEL" ? "\t" : ",";
  const header = fieldKeys.join(delimiter);
  const rows = records.map((record) =>
    fieldKeys
      .map((key) => {
        const value = record[key] ?? "";
        return format === "EXCEL" ? String(value) : escapeCsvValue(value);
      })
      .join(delimiter),
  );

  const mimeType =
    format === "EXCEL"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv";

  return {
    content: [header, ...rows].join("\n"),
    mimeType,
    fileExtension: format === "EXCEL" ? "xlsx" : "csv",
  };
}

export function resolveFormatFromFileName(fileName: string): ImportExportFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return "CSV";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "EXCEL";
  if (lower.endsWith(".json")) return "JSON";
  if (lower.endsWith(".pdf")) return "PDF";
  return null;
}
