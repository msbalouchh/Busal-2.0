-- CreateEnum
CREATE TYPE "StaffEmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PROBATION');

-- CreateEnum
CREATE TYPE "StaffAccountStatus" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "StaffInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "StaffAuditEventType" AS ENUM (
  'CREATED',
  'UPDATED',
  'INVITED',
  'INVITATION_RESENT',
  'INVITATION_CANCELLED',
  'ROLE_CHANGED',
  'BRANCH_CHANGED',
  'PERMISSION_CHANGED',
  'ACTIVATED',
  'DEACTIVATED',
  'LOCKED',
  'SUSPENDED',
  'REACTIVATED',
  'PASSWORD_RESET',
  'LOGIN',
  'BULK_UPDATE',
  'ARCHIVED',
  'DUPLICATE'
);

-- AlterTable
ALTER TABLE "staff"
  ADD COLUMN "employee_id" TEXT,
  ADD COLUMN "department" TEXT,
  ADD COLUMN "job_title" TEXT,
  ADD COLUMN "employment_status" "StaffEmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "staff_profile" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "account_status" "StaffAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "last_login_at" TIMESTAMP(3),
  ADD COLUMN "force_password_reset" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "staff_business_id_employee_id_key" ON "staff"("business_id", "employee_id");

-- CreateTable
CREATE TABLE "staff_branch_assignments" (
  "id" TEXT NOT NULL,
  "staff_id" TEXT NOT NULL,
  "branch_id" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "staff_branch_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_invitations" (
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
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "staff_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_audit_logs" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "staff_id" TEXT,
  "event_type" "StaffAuditEventType" NOT NULL,
  "actor_user_id" TEXT,
  "actor_staff_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "staff_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_branch_assignments_staff_id_branch_id_key" ON "staff_branch_assignments"("staff_id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_invitations_token_key" ON "staff_invitations"("token");

-- CreateIndex
CREATE INDEX "staff_invitations_business_id_status_idx" ON "staff_invitations"("business_id", "status");

-- CreateIndex
CREATE INDEX "staff_invitations_business_id_email_idx" ON "staff_invitations"("business_id", "email");

-- CreateIndex
CREATE INDEX "staff_audit_logs_business_id_created_at_idx" ON "staff_audit_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "staff_audit_logs_staff_id_event_type_idx" ON "staff_audit_logs"("staff_id", "event_type");

-- AddForeignKey
ALTER TABLE "staff_branch_assignments" ADD CONSTRAINT "staff_branch_assignments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_branch_assignments" ADD CONSTRAINT "staff_branch_assignments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_audit_logs" ADD CONSTRAINT "staff_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_audit_logs" ADD CONSTRAINT "staff_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
