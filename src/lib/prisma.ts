import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Use DATABASE_URL pooler (port 6543) for runtime queries.
  // Use DIRECT_URL (port 5432) only for migrations via schema.prisma.
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function hasReservationDelegate(client: PrismaClient): boolean {
  return "reservation" in (client as unknown as Record<string, unknown>);
}

function hasTableDelegate(client: PrismaClient): boolean {
  return "table" in (client as unknown as Record<string, unknown>);
}

function hasQRCodeDelegate(client: PrismaClient): boolean {
  return "qRCode" in (client as unknown as Record<string, unknown>);
}

function hasCartDelegate(client: PrismaClient): boolean {
  return "cart" in (client as unknown as Record<string, unknown>);
}

function hasOrderSessionDelegate(client: PrismaClient): boolean {
  return "orderSession" in (client as unknown as Record<string, unknown>);
}

function hasOrderDelegate(client: PrismaClient): boolean {
  return "order" in (client as unknown as Record<string, unknown>);
}

function hasKitchenQueueDelegate(client: PrismaClient): boolean {
  return "kitchenQueue" in (client as unknown as Record<string, unknown>);
}

function hasStaffUserIdField(client: PrismaClient): boolean {
  const staffModel = (
    client as unknown as {
      _runtimeDataModel?: { models?: Record<string, { fields?: Array<{ name: string }> }> };
    }
  )._runtimeDataModel?.models?.Staff;

  return Boolean(staffModel?.fields?.some((field) => field.name === "userId"));
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  // Recreate after schema changes when the dev server was not restarted.
  if (
    process.env.NODE_ENV === "development" &&
    cached &&
    (!hasReservationDelegate(cached) ||
      !hasTableDelegate(cached) ||
      !hasQRCodeDelegate(cached) ||
      !hasCartDelegate(cached) ||
      !hasOrderSessionDelegate(cached) ||
      !hasOrderDelegate(cached) ||
      !hasKitchenQueueDelegate(cached) ||
      !hasStaffUserIdField(cached))
  ) {
    void cached.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
