import type {
  DuplicateDetectionResult,
  SchemaFieldDefinition,
} from "@/modules/import-export-platform/types/import-export-platform-types";

export function detectDuplicates(
  rows: Array<Record<string, string>>,
  fields: SchemaFieldDefinition[],
): DuplicateDetectionResult {
  const uniqueFields = fields.filter((field) => field.uniqueKey);
  if (uniqueFields.length === 0) {
    return { duplicates: 0, uniqueRecords: rows };
  }

  const seen = new Set<string>();
  const uniqueRecords: Array<Record<string, string>> = [];
  let duplicates = 0;

  for (const row of rows) {
    const key = uniqueFields.map((field) => row[field.key] ?? "").join("::");
    if (!key || seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    uniqueRecords.push(row);
  }

  return { duplicates, uniqueRecords };
}

export function buildDuplicateKey(
  row: Record<string, string>,
  fields: SchemaFieldDefinition[],
): string {
  return fields
    .filter((field) => field.uniqueKey)
    .map((field) => row[field.key] ?? "")
    .join("::");
}
