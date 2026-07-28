import type { JsonSchema } from "@/modules/ai-tools/types/tool-types";

function assertType(value: unknown, expected: string, field: string): void {
  if (expected === "string" && typeof value !== "string") {
    throw new Error(`Invalid type for ${field}: expected string`);
  }
  if (expected === "number" && typeof value !== "number") {
    throw new Error(`Invalid type for ${field}: expected number`);
  }
  if (expected === "boolean" && typeof value !== "boolean") {
    throw new Error(`Invalid type for ${field}: expected boolean`);
  }
  if (
    expected === "object" &&
    (typeof value !== "object" || value === null || Array.isArray(value))
  ) {
    throw new Error(`Invalid type for ${field}: expected object`);
  }
  if (expected === "array" && !Array.isArray(value)) {
    throw new Error(`Invalid type for ${field}: expected array`);
  }
}

function validateValue(schema: JsonSchema, value: unknown, field: string): void {
  if (schema.enum && !schema.enum.includes(String(value))) {
    throw new Error(`Invalid value for ${field}: must be one of ${schema.enum.join(", ")}`);
  }

  if (schema.type) {
    assertType(value, schema.type, field);
  }

  if (
    schema.type === "object" &&
    schema.properties &&
    typeof value === "object" &&
    value !== null
  ) {
    const record = value as Record<string, unknown>;
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in record) {
        validateValue(propSchema, record[key], `${field}.${key}`);
      }
    }
  }

  if (schema.type === "array" && schema.items && Array.isArray(value)) {
    value.forEach((item, index) => {
      validateValue(schema.items!, item, `${field}[${index}]`);
    });
  }
}

export function validateToolInput(schema: JsonSchema, input: Record<string, unknown>): void {
  if (schema.type && schema.type !== "object") {
    throw new Error("Tool input schema root must be an object");
  }

  for (const key of schema.required ?? []) {
    if (!(key in input)) {
      throw new Error(`Missing required field: ${key}`);
    }
  }

  for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
    if (key in input) {
      validateValue(propSchema, input[key], key);
    }
  }
}
