import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

function parsePrismaSchema() {
  const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
  const models = [];
  const enums = [];
  let current = null;
  let mapName = null;

  for (const line of schema.split("\n")) {
    const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
    if (modelMatch) {
      current = { name: modelMatch[1], map: null };
      mapName = null;
      continue;
    }
    const enumMatch = line.match(/^enum\s+(\w+)\s+\{/);
    if (enumMatch) {
      current = { name: enumMatch[1], type: "enum" };
      continue;
    }
    if (current && line.includes("@@map(")) {
      const m = line.match(/@@map\("([^"]+)"\)/);
      if (m) mapName = m[1];
    }
    if (line.trim() === "}" && current) {
      if (current.type === "enum") {
        enums.push(current.name);
      } else {
        models.push(mapName ?? toSnakeTable(current.name));
      }
      current = null;
      mapName = null;
    }
  }
  return { models, enums, modelCount: models.length, enumCount: enums.length };
}

function toSnakeTable(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

try {
  const parsed = parsePrismaSchema();

  const dbTables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  const tableNames = dbTables.map((r) => r.table_name);

  const dbEnums = await prisma.$queryRaw`
    SELECT t.typname AS name
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype = 'e'
    ORDER BY t.typname
  `;
  const enumNames = dbEnums.map((r) => r.name);

  const applied = await prisma.$queryRaw`
    SELECT migration_name, finished_at, rolled_back_at, logs
    FROM _prisma_migrations
    ORDER BY finished_at NULLS LAST
  `;

  const failed = applied.filter((m) => m.finished_at === null && m.rolled_back_at === null);
  const appliedNames = applied.filter((m) => m.finished_at !== null).map((m) => m.migration_name);

  const missingTables = parsed.models.filter((t) => !tableNames.includes(t));
  const extraTables = tableNames.filter(
    (t) => !parsed.models.includes(t) && t !== "_prisma_migrations",
  );

  const missingEnums = parsed.enums.filter((e) => !enumNames.includes(e));
  const extraEnums = enumNames.filter((e) => !parsed.enums.includes(e));

  console.log(
    JSON.stringify(
      {
        prisma: {
          models: parsed.modelCount,
          enums: parsed.enumCount,
          mappedTables: parsed.models.length,
        },
        database: {
          tables: tableNames.length,
          enums: enumNames.length,
          connected: true,
        },
        migrations: {
          totalInRepo: fs
            .readdirSync("prisma/migrations")
            .filter((d) => fs.statSync(`prisma/migrations/${d}`).isDirectory()).length,
          applied: appliedNames.length,
          failed: failed.length,
          lastApplied: appliedNames.slice(-3),
        },
        drift: {
          missingTables: missingTables.slice(0, 50),
          missingTablesCount: missingTables.length,
          extraTables: extraTables.slice(0, 30),
          extraTablesCount: extraTables.length,
          missingEnums: missingEnums.slice(0, 30),
          missingEnumsCount: missingEnums.length,
          extraEnums: extraEnums.slice(0, 30),
          extraEnumsCount: extraEnums.length,
        },
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("AUDIT_ERROR:", error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
