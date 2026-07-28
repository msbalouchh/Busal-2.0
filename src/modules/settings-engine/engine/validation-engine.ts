import type { ConfigValueType } from "@prisma/client";

import type {
  RegisteredSettingDefinition,
  ValidationResult,
} from "@/modules/settings-engine/types/settings-engine-types";

export function validateSettingValue(
  definition: RegisteredSettingDefinition,
  value: unknown,
): ValidationResult {
  const errors: string[] = [];

  if (definition.isRequired && isEmptyValue(value)) {
    errors.push(`${definition.key} is required`);
  }

  if (value === null || value === undefined || value === "") {
    return { valid: errors.length === 0, errors };
  }

  switch (definition.valueType) {
    case "STRING":
    case "SECRET":
      if (typeof value !== "string") {
        errors.push(`${definition.key} must be a string`);
      }
      break;
    case "NUMBER":
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push(`${definition.key} must be a number`);
      }
      break;
    case "BOOLEAN":
      if (typeof value !== "boolean") {
        errors.push(`${definition.key} must be a boolean`);
      }
      break;
    case "DATE":
    case "TIME":
      if (typeof value !== "string") {
        errors.push(
          `${definition.key} must be a valid ${definition.valueType.toLowerCase()} string`,
        );
      }
      break;
    case "JSON":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(`${definition.key} must be a JSON object`);
      }
      break;
    case "ARRAY":
      if (!Array.isArray(value)) {
        errors.push(`${definition.key} must be an array`);
      }
      break;
    case "ENUM":
      if (typeof value !== "string") {
        errors.push(`${definition.key} must be an enum string`);
      }
      break;
    default:
      break;
  }

  if (definition.allowedValues?.length && !definition.allowedValues.includes(value)) {
    errors.push(`${definition.key} must be one of: ${definition.allowedValues.join(", ")}`);
  }

  if (definition.valueType === "NUMBER" && typeof value === "number") {
    if (definition.minValue !== undefined && value < definition.minValue) {
      errors.push(`${definition.key} must be at least ${definition.minValue}`);
    }

    if (definition.maxValue !== undefined && value > definition.maxValue) {
      errors.push(`${definition.key} must be at most ${definition.maxValue}`);
    }
  }

  if (
    definition.regexPattern &&
    typeof value === "string" &&
    !new RegExp(definition.regexPattern).test(value)
  ) {
    errors.push(`${definition.key} does not match required pattern`);
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidSettingValue(
  definition: RegisteredSettingDefinition,
  value: unknown,
): void {
  const result = validateSettingValue(definition, value);
  if (!result.valid) {
    throw new Error(result.errors.join("; "));
  }
}

export function coerceSettingValue(valueType: ConfigValueType, value: unknown): unknown {
  switch (valueType) {
    case "NUMBER":
      return typeof value === "number" ? value : Number(value);
    case "BOOLEAN":
      return typeof value === "boolean" ? value : value === "true" || value === true;
    case "ARRAY":
    case "JSON":
      return typeof value === "string" ? JSON.parse(value) : value;
    default:
      return value;
  }
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}
