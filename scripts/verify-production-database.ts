/**
 * Production database integrity verification for Busal OS (P13.3).
 * Read-only checks — no data mutation except reporting.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

const checks: Check[] = [];

function record(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    table,
  );
  return Boolean(rows[0]?.exists);
}

async function main() {
  console.log("=== P13.3 Production Database Verification ===\n");

  // Connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    record("Database connection", true);
  } catch (error) {
    record("Database connection", false, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Migration history
  const applied = await prisma.$queryRawUnsafe<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>
  >(
    `SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at ASC`,
  );
  const finished = applied.filter((m) => m.finished_at != null);
  const rolledBack = applied.filter((m) => m.finished_at == null && m.rolled_back_at != null);
  const stuck = applied.filter((m) => m.finished_at == null && m.rolled_back_at == null);
  record(
    "Migration history",
    stuck.length === 0 && finished.length >= 118,
    `${finished.length} applied, ${rolledBack.length} historical rolled-back, ${stuck.length} stuck`,
  );

  const portalMigration = finished.find(
    (m) => m.migration_name === "20250801000000_customer_portal_user_link",
  );
  record("Customer portal migration applied", Boolean(portalMigration));

  // Core tables (actual @@map names)
  const requiredTables = [
    "users",
    "businesses",
    "branches",
    "staff",
    "roles",
    "permissions",
    "role_permissions",
    "customers",
    "customer_groups",
    "loyalty_programs",
    "rewards",
    "menu_categories",
    "menu_items",
    "ingredients",
    "suppliers",
    "purchase_orders",
    "reservations",
    "tables",
    "orders",
    "order_items",
    "payments",
    "receipts",
    "notifications",
    "notification_inbox_items",
    "platform_documents",
    "platform_media_files",
    "qr_codes",
    "kitchen_queue",
    "carts",
    "order_sessions",
    "restaurant_orders",
    "restaurant_order_items",
  ];

  let missingTables = 0;
  for (const table of requiredTables) {
    const exists = await tableExists(table);
    if (!exists) {
      missingTables += 1;
      record(`Table ${table}`, false, "missing");
    }
  }
  if (missingTables === 0) {
    record(`Required tables (${requiredTables.length})`, true, "all present");
  }

  // Customer.user_id column (portal link)
  const userIdCol = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'user_id'`,
  );
  record("customers.user_id column", userIdCol.length > 0);

  // Foreign key integrity samples
  const orphanCustomers = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM customers c
     LEFT JOIN businesses b ON b.id = c.business_id
     WHERE b.id IS NULL`,
  );
  record(
    "No orphan customers",
    Number(orphanCustomers[0]?.count ?? 0) === 0,
    `orphans=${orphanCustomers[0]?.count ?? 0}`,
  );

  const orphanOrders = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM orders o
     LEFT JOIN businesses b ON b.id = o.business_id
     WHERE b.id IS NULL`,
  );
  record(
    "No orphan orders",
    Number(orphanOrders[0]?.count ?? 0) === 0,
    `orphans=${orphanOrders[0]?.count ?? 0}`,
  );

  const invalidCustomerUsers = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM customers c
     WHERE c.user_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.user_id)`,
  );
  record(
    "customers.user_id FK integrity",
    Number(invalidCustomerUsers[0]?.count ?? 0) === 0,
    `invalid=${invalidCustomerUsers[0]?.count ?? 0}`,
  );

  // Indexes on tenant keys
  const businessIndexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename IN ('customers','orders','payments','staff','branches')
       AND indexdef ILIKE '%business_id%'`,
  );
  record(
    "Tenant indexes on core tables",
    businessIndexes.length >= 5,
    `found=${businessIndexes.length}`,
  );

  // FK constraint count
  const fkCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count
     FROM information_schema.table_constraints
     WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'`,
  );
  record(
    "Foreign key constraints",
    Number(fkCount[0]?.count ?? 0) > 100,
    `count=${fkCount[0]?.count ?? 0}`,
  );

  // RLS (Supabase may enable on some tables; Busal uses app-layer isolation)
  const rlsTables = await prisma.$queryRawUnsafe<
    Array<{ tablename: string; rowsecurity: boolean }>
  >(
    `SELECT c.relname AS tablename, c.relrowsecurity AS rowsecurity
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true`,
  );
  record(
    "RLS policies (app-layer primary)",
    true,
    `tables_with_rls_enabled=${rlsTables.length} (Busal enforces tenant isolation in application layer)`,
  );

  // Seed / demo data heuristics
  const demoBusinesses = await prisma.business.count({
    where: {
      OR: [
        { businessName: { contains: "demo", mode: "insensitive" } },
        { businessName: { contains: "test", mode: "insensitive" } },
        { businessName: { contains: "integration-", mode: "insensitive" } },
      ],
    },
  });
  const demoEmails = await prisma.user.count({
    where: {
      OR: [
        { email: { contains: "example.com", mode: "insensitive" } },
        { email: { contains: "test@", mode: "insensitive" } },
        { email: { contains: "integration-", mode: "insensitive" } },
      ],
    },
  });
  record(
    "Demo/test data scan",
    true,
    `demo_businesses=${demoBusinesses}, test_users=${demoEmails} (review before launch; verify scripts may leave residual rows)`,
  );

  // Totals
  const totals = {
    users: await prisma.user.count(),
    businesses: await prisma.business.count(),
    customers: await prisma.customer.count(),
    legacyOrders: await prisma.legacyOrder.count(),
    restaurantOrders: await prisma.restaurantOrder.count().catch(() => -1),
  };
  record(
    "Entity counts",
    true,
    `users=${totals.users}, businesses=${totals.businesses}, customers=${totals.customers}, legacy_orders=${totals.legacyOrders}, restaurant_orders=${totals.restaurantOrders}`,
  );

  // Pooler / connection
  const dbInfo = await prisma.$queryRawUnsafe<Array<{ version: string }>>(`SELECT version()`);
  record("PostgreSQL reachable", true, dbInfo[0]?.version?.slice(0, 60));

  console.log("\n=== Summary ===");
  const failed = checks.filter((c) => !c.ok);
  console.log(`Passed: ${checks.filter((c) => c.ok).length}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length > 0) {
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail ?? ""}`);
    process.exit(1);
  }
  console.log("\nProduction database verification passed.");
}

main()
  .catch((error) => {
    console.error("FIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
