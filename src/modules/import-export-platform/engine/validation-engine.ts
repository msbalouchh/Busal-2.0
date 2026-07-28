import type {
  SchemaFieldDefinition,
  ValidationResult,
} from "@/modules/import-export-platform/types/import-export-platform-types";

function validateFieldType(value: string, field: SchemaFieldDefinition): string | null {
  if (!value) {
    return null;
  }

  switch (field.type) {
    case "number":
      return Number.isNaN(Number(value)) ? `${field.label} must be a number` : null;
    case "email":
      return value.includes("@") ? null : `${field.label} must be a valid email`;
    case "boolean":
      return ["true", "false", "1", "0", "yes", "no"].includes(value.toLowerCase())
        ? null
        : `${field.label} must be a boolean`;
    case "date":
      return Number.isNaN(Date.parse(value)) ? `${field.label} must be a valid date` : null;
    default:
      return null;
  }
}

export function validateImportRows(
  rows: Array<Record<string, string>>,
  fields: SchemaFieldDefinition[],
): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  rows.forEach((row, rowIndex) => {
    for (const field of fields) {
      const value = row[field.key] ?? "";

      if (field.required && !value.trim()) {
        errors.push({
          rowIndex,
          field: field.key,
          message: `${field.label} is required`,
        });
        continue;
      }

      const typeError = validateFieldType(value, field);
      if (typeError) {
        errors.push({ rowIndex, field: field.key, message: typeError });
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

export function filterValidRows(
  rows: Array<Record<string, string>>,
  validation: ValidationResult,
): Array<Record<string, string>> {
  const invalidRows = new Set(validation.errors.map((error) => error.rowIndex));
  return rows.filter((_, index) => !invalidRows.has(index));
}
