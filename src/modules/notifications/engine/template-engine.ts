import type {
  RenderedTemplate,
  TemplateVariableDefinition,
} from "@/modules/notifications/types/notification-types";

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export function extractTemplateVariables(body: string, subject?: string | null): string[] {
  const keys = new Set<string>();
  const sources = subject ? [body, subject] : [body];

  for (const source of sources) {
    for (const match of source.matchAll(VARIABLE_PATTERN)) {
      keys.add(match[1] ?? "");
    }
  }

  return Array.from(keys).filter(Boolean);
}

export function renderTemplate(input: {
  subject?: string | null;
  body: string;
  variables: Record<string, string>;
}): RenderedTemplate {
  const replace = (text: string) =>
    text.replace(VARIABLE_PATTERN, (_, key: string) => input.variables[key] ?? "");

  return {
    subject: input.subject ? replace(input.subject) : null,
    body: replace(input.body),
  };
}

export function validateTemplateVariables(
  definitions: TemplateVariableDefinition[],
  variables: Record<string, string>,
): { valid: boolean; missing: string[] } {
  const missing = definitions
    .filter((def) => def.required && !variables[def.key])
    .map((def) => def.key);
  return { valid: missing.length === 0, missing };
}
