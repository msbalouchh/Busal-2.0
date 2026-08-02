export interface PermissionGroupDefinition {
  id: string;
  label: string;
  modulePrefixes: string[];
}

const BASE_GROUPS: PermissionGroupDefinition[] = [
  { id: "dashboard", label: "Dashboard", modulePrefixes: ["dashboard", "analytics", "reporting"] },
  { id: "business", label: "Business", modulePrefixes: ["business", "branch", "tenant"] },
  { id: "staff", label: "Staff", modulePrefixes: ["staff", "iam", "roles", "modules"] },
  {
    id: "restaurant",
    label: "Restaurant",
    modulePrefixes: [
      "menu",
      "reservation",
      "table",
      "qr",
      "cart",
      "order",
      "kitchen",
      "pos",
      "payment",
      "receipt",
      "restaurant",
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    modulePrefixes: [
      "commercial",
      "sales",
      "quotes",
      "contracts",
      "implementation",
      "success",
      "revenue",
      "crm",
    ],
  },
  { id: "ai", label: "AI", modulePrefixes: ["ai", "knowledge", "automation", "agent"] },
  { id: "marketplace", label: "Marketplace", modulePrefixes: ["marketplace"] },
  {
    id: "platform",
    label: "Platform",
    modulePrefixes: [
      "notifications",
      "communication",
      "files",
      "search",
      "feature",
      "api",
      "monitoring",
      "backup",
      "localization",
      "import",
      "export",
    ],
  },
  { id: "settings", label: "Settings", modulePrefixes: ["settings", "inventory", "recipe"] },
];

const customGroups: PermissionGroupDefinition[] = [];

export function registerPermissionGroup(group: PermissionGroupDefinition): void {
  const existing = customGroups.find((entry) => entry.id === group.id);
  if (existing) {
    Object.assign(existing, group);
    return;
  }
  customGroups.push(group);
}

export function listPermissionGroups(): PermissionGroupDefinition[] {
  return [...BASE_GROUPS, ...customGroups];
}

export function resolvePermissionGroup(module: string): PermissionGroupDefinition {
  const normalized = module.toLowerCase();
  const groups = listPermissionGroups();
  const match =
    groups.find((group) =>
      group.modulePrefixes.some(
        (prefix) => normalized === prefix || normalized.startsWith(`${prefix}.`),
      ),
    ) ?? groups.find((group) => group.id === "platform");

  return match ?? { id: "platform", label: "Platform", modulePrefixes: [normalized] };
}
