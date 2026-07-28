-- Authorization foundation: permission code/module fields and composite role_permissions PK

DELETE FROM "role_permissions";
DELETE FROM "permissions";

ALTER TABLE "permissions" RENAME COLUMN "key" TO "code";
ALTER TABLE "permissions" RENAME COLUMN "category" TO "module";
ALTER TABLE "permissions" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey";
ALTER TABLE "role_permissions" DROP COLUMN "id";
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at") VALUES
  (gen_random_uuid(), 'business.view', 'View Business', 'View business profile and settings', 'business', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'business.update', 'Update Business', 'Edit business profile information', 'business', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staff.view', 'View Staff', 'View staff members and roles', 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staff.create', 'Create Staff', 'Add staff members', 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staff.update', 'Update Staff', 'Edit staff members', 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staff.delete', 'Delete Staff', 'Remove staff members', 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'menu.view', 'View Menu', 'View menu items and categories', 'menu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'menu.create', 'Create Menu Items', 'Create menu items and categories', 'menu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'menu.update', 'Update Menu Items', 'Edit menu items and categories', 'menu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'menu.delete', 'Delete Menu Items', 'Delete menu items and categories', 'menu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'reservation.view', 'View Reservations', 'View table reservations', 'reservation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'reservation.manage', 'Manage Reservations', 'Create and manage reservations', 'reservation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'table.manage', 'Manage Tables', 'Create and manage tables', 'table', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'qr.manage', 'Manage QR Codes', 'Create and manage QR menu codes', 'qr', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'cart.manage', 'Manage Carts', 'Manage customer carts', 'cart', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'order.view', 'View Orders', 'View customer orders', 'order', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'order.create', 'Create Orders', 'Create customer orders', 'order', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'order.cancel', 'Cancel Orders', 'Cancel customer orders', 'order', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'kitchen.view', 'View Kitchen', 'View kitchen display queue', 'kitchen', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'kitchen.update', 'Update Kitchen', 'Update kitchen queue status', 'kitchen', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'pos.use', 'Use POS', 'Access point-of-sale features', 'pos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payment.create', 'Create Payments', 'Process payments', 'payment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payment.refund', 'Refund Payments', 'Issue payment refunds', 'payment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'crm.manage', 'Manage CRM', 'Manage customer relationships', 'crm', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'analytics.view', 'View Analytics', 'View business analytics', 'analytics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
