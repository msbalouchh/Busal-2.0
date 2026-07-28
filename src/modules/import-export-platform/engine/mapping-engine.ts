import type {
  FieldMappingDefinition,
  SchemaFieldDefinition,
} from "@/modules/import-export-platform/types/import-export-platform-types";

export function applyFieldMappings(
  rows: Array<Record<string, string>>,
  mappings: FieldMappingDefinition[],
): Array<Record<string, string>> {
  if (mappings.length === 0) {
    return rows;
  }

  return rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const mapping of mappings) {
      mapped[mapping.targetField] = row[mapping.sourceField] ?? "";
    }
    return mapped;
  });
}

export function buildDefaultFieldMappings(
  sourceFields: string[],
  targetFields: SchemaFieldDefinition[],
): FieldMappingDefinition[] {
  const mappings: FieldMappingDefinition[] = [];

  for (const target of targetFields) {
    const match =
      sourceFields.find((field) => field.toLowerCase() === target.key.toLowerCase()) ??
      sourceFields.find((field) => field.toLowerCase() === target.label.toLowerCase());

    if (match) {
      mappings.push({ sourceField: match, targetField: target.key });
    }
  }

  return mappings;
}

export function resolveMappedFieldKeys(mappings: FieldMappingDefinition[]): string[] {
  return mappings.map((mapping) => mapping.targetField);
}
