/** Generates stable workspace identifiers from business identity. */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function randomSuffix(length = 4): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return result;
}

export function generateWorkspaceSlug(businessName: string): string {
  const base = slugify(businessName);
  if (!base) return `workspace-${randomSuffix(6)}`;
  return `${base}-${randomSuffix(4)}`;
}

export function generateBusinessId(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `BUS-${n}`;
}

export function generateTenantId(): string {
  const segment = () => randomSuffix(4).toUpperCase();
  return `TNT-${segment()}-${segment()}-${segment()}`;
}

export function syncIdentityIdentifiers(businessName: string) {
  return {
    workspaceSlug: generateWorkspaceSlug(businessName),
    businessId: generateBusinessId(),
    tenantId: generateTenantId(),
  };
}
