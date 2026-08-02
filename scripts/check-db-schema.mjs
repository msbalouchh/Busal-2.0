import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('receipts', 'receipt_items', 'receipt_sequences', 'receipt_print_logs', 'receipt_audit_logs')
    ORDER BY table_name
  `;
  console.log("RECEIPT_TABLES:", JSON.stringify(tables));

  const enums = await prisma.$queryRaw`
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname IN ('ReceiptTemplateType', 'ReceiptPrintStatus', 'ReceiptPaperSize', 'ReceiptAuditAction')
    ORDER BY t.typname
  `;
  console.log("RECEIPT_ENUMS:", JSON.stringify(enums));

  const lastApplied = await prisma.$queryRaw`
    SELECT migration_name, finished_at
    FROM _prisma_migrations
    WHERE finished_at IS NOT NULL
    ORDER BY finished_at DESC
    LIMIT 5
  `;
  console.log("LAST_APPLIED:", JSON.stringify(lastApplied));
} finally {
  await prisma.$disconnect();
}
