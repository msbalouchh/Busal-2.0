-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_roles" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_business_id_slug_key" ON "roles"("business_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_roles_staff_id_role_id_key" ON "staff_roles"("staff_id", "role_id");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_roles" ADD CONSTRAINT "staff_roles_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_roles" ADD CONSTRAINT "staff_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed permissions catalog
INSERT INTO "permissions" ("id", "key", "name", "description", "category", "created_at") VALUES
  (gen_random_uuid(), 'dashboard.view', 'View Dashboard', 'Access the main dashboard', 'Dashboard', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'business.view', 'View Business', 'View business profile and settings', 'Business', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'business.edit', 'Edit Business', 'Edit business profile information', 'Business', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'branches.manage', 'Manage Branches', 'Create, edit, and delete branches', 'Business', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staff.view', 'View Staff', 'View staff members and roles', 'Staff', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staff.manage', 'Manage Staff', 'Add, edit, and deactivate staff members', 'Staff', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'roles.view', 'View Roles', 'View role definitions', 'Staff', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'roles.manage', 'Manage Roles', 'Create and edit custom roles', 'Staff', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'permissions.manage', 'Manage Permissions', 'Assign permissions to roles', 'Staff', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'orders.view', 'View Orders', 'View customer orders', 'Operations', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'orders.manage', 'Manage Orders', 'Create and update orders', 'Operations', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'menu.view', 'View Menu', 'View menu items', 'Operations', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'menu.manage', 'Manage Menu', 'Create and edit menu items', 'Operations', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'reservations.view', 'View Reservations', 'View table reservations', 'Operations', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'reservations.manage', 'Manage Reservations', 'Create and manage reservations', 'Operations', CURRENT_TIMESTAMP);
