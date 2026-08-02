import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { listPermissionGroups } from "../src/modules/staff/registry/permission-groups";
import { STAFF_MANAGEMENT_ROUTES } from "../src/modules/staff/constants/staff-management";
import {
  createStaffMemberProfile,
  getStaffManagementBundle,
  inviteStaffMember,
} from "../src/services/staff-management-module.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Staff management module structure");
  const moduleFiles = [
    "src/modules/staff/index.ts",
    "src/modules/staff/types/staff-management-types.ts",
    "src/modules/staff/constants/staff-management.ts",
    "src/modules/staff/registry/permission-groups.ts",
    "src/modules/staff/lib/get-staff-context.ts",
    "src/modules/staff/actions/staff-management-actions.ts",
    "src/modules/staff/components/staff-directory.tsx",
    "src/modules/staff/components/staff-profile-detail.tsx",
    "src/modules/staff/components/staff-invitations-panel.tsx",
    "src/modules/staff/components/staff-roles-panel.tsx",
    "src/services/staff-management-module.service.ts",
    "src/app/dashboard/staff/directory/page.tsx",
    "src/app/dashboard/staff/invitations/page.tsx",
    "src/app/dashboard/staff/members/[staffId]/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read("src/modules/staff/lib/get-staff-context.ts");
  assert(contextLoader.includes("PERMISSION_CODES.STAFF_VIEW"), "STAFF_VIEW guard missing");
  const actions = read("src/modules/staff/actions/staff-management-actions.ts");
  assert(actions.includes("protectedAction"), "protectedAction missing");
  assert(actions.includes("PERMISSION_CODES.STAFF_CREATE"), "STAFF_CREATE action missing");
  console.log("  PASS");

  console.log("Permission group registry");
  assert(listPermissionGroups().length >= 8, "Permission groups missing");
  console.log("  PASS");

  console.log("Dashboard routes");
  for (const route of Object.values(STAFF_MANAGEMENT_ROUTES)) {
    assert(route.startsWith("/dashboard/staff"), `Invalid route: ${route}`);
  }
  console.log("  PASS");

  console.log("Live staff management workflow");
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "StaffEmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PROBATION');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "StaffAccountStatus" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "StaffInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "StaffAuditEventType" AS ENUM (
        'CREATED', 'UPDATED', 'INVITED', 'INVITATION_RESENT', 'INVITATION_CANCELLED',
        'ROLE_CHANGED', 'BRANCH_CHANGED', 'PERMISSION_CHANGED', 'ACTIVATED', 'DEACTIVATED',
        'LOCKED', 'SUSPENDED', 'REACTIVATED', 'PASSWORD_RESET', 'LOGIN', 'BULK_UPDATE',
        'ARCHIVED', 'DUPLICATE'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_archived" BOOLEAN NOT NULL DEFAULT false
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "staff"
      ADD COLUMN IF NOT EXISTS "employee_id" TEXT,
      ADD COLUMN IF NOT EXISTS "department" TEXT,
      ADD COLUMN IF NOT EXISTS "job_title" TEXT,
      ADD COLUMN IF NOT EXISTS "staff_profile" JSONB NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "force_password_reset" BOOLEAN NOT NULL DEFAULT false
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "staff" ADD COLUMN "employment_status" "StaffEmploymentStatus" NOT NULL DEFAULT 'ACTIVE';
    EXCEPTION WHEN duplicate_column THEN null; END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "staff" ADD COLUMN "account_status" "StaffAccountStatus" NOT NULL DEFAULT 'ACTIVE';
    EXCEPTION WHEN duplicate_column THEN null; END $$;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "staff_business_id_employee_id_key"
      ON "staff"("business_id", "employee_id")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "staff_branch_assignments" (
      "id" TEXT NOT NULL,
      "staff_id" TEXT NOT NULL,
      "branch_id" TEXT NOT NULL,
      "is_default" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "staff_branch_assignments_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "staff_branch_assignments_staff_id_branch_id_key"
      ON "staff_branch_assignments"("staff_id", "branch_id")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "staff_invitations" (
      "id" TEXT NOT NULL,
      "business_id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "role_id" TEXT,
      "branch_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "default_branch_id" TEXT,
      "token" TEXT NOT NULL,
      "status" "StaffInvitationStatus" NOT NULL DEFAULT 'PENDING',
      "invited_by_user_id" TEXT,
      "invited_by_staff_id" TEXT,
      "expires_at" TIMESTAMP(3) NOT NULL,
      "accepted_at" TIMESTAMP(3),
      "cancelled_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "staff_invitations_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "staff_invitations_token_key" ON "staff_invitations"("token")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "staff_audit_logs" (
      "id" TEXT NOT NULL,
      "business_id" TEXT NOT NULL,
      "staff_id" TEXT,
      "event_type" "StaffAuditEventType" NOT NULL,
      "actor_user_id" TEXT,
      "actor_staff_id" TEXT,
      "metadata" JSONB,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "staff_audit_logs_pkey" PRIMARY KEY ("id")
    )
  `);

  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  assert(business, "No business found for verification");

  const platform = await buildPlatformContext(business.id);
  const bundle = await getStaffManagementBundle(platform);

  assert(typeof bundle.permissionsFlags.canView === "boolean", "Permission flags missing");
  assert(Array.isArray(bundle.directory.items), "Directory missing");

  const member = await createStaffMemberProfile(platform, {
    firstName: "Verify",
    lastName: "Staff",
    email: `verify-staff-${Date.now()}@example.com`,
    employeeCode: `EMP-${Date.now()}`,
    department: "Operations",
    jobTitle: "Verifier",
  });

  assert(member.id.length > 0, "Staff profile creation failed");

  const invitation = await inviteStaffMember(platform, {
    email: `verify-invite-${Date.now()}@example.com`,
  });

  assert(invitation.status === "PENDING", "Invitation creation failed");

  await prisma.staff.delete({ where: { id: member.id } }).catch(() => undefined);
  await prisma.staffInvitation.delete({ where: { id: invitation.id } }).catch(() => undefined);

  console.log("  PASS");

  console.log("\nStaff management verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
