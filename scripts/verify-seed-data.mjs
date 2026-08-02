import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const [permissions, roles, businesses, users, modules] = await Promise.all([
    prisma.permission.count(),
    prisma.role.count(),
    prisma.business.count(),
    prisma.user.count(),
    prisma.businessModule.count(),
  ]);

  const samplePermissions = await prisma.permission.findMany({
    select: { code: true, module: true },
    orderBy: { code: "asc" },
    take: 5,
  });

  const relationChecks = await Promise.allSettled([
    prisma.business.findFirst({ include: { owner: true, branches: { take: 1 } } }),
    prisma.user.findFirst({ include: { businesses: { take: 1 } } }),
    prisma.platformCloudTenant.findFirst(),
    prisma.platformEnterpriseOrganization.findFirst(),
    prisma.platformDocument.findFirst(),
  ]);

  console.log(
    JSON.stringify(
      {
        seedData: {
          permissions,
          roles,
          businesses,
          users,
          businessModules: modules,
          samplePermissions,
        },
        relationChecks: relationChecks.map((r, i) => ({
          index: i,
          status: r.status,
          ok: r.status === "fulfilled",
        })),
        allRelationsAccessible: relationChecks.every((r) => r.status === "fulfilled"),
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("SEED_CHECK_ERROR:", error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
