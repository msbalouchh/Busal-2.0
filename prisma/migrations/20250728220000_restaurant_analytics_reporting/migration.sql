-- Restaurant Analytics & Reporting

CREATE TYPE "ReportType" AS ENUM (
  'SALES',
  'ORDERS',
  'CUSTOMERS',
  'PRODUCTS',
  'PAYMENTS',
  'RESERVATIONS',
  'INVENTORY',
  'STAFF',
  'KITCHEN',
  'CUSTOM'
);

CREATE TYPE "WidgetType" AS ENUM (
  'LINE_CHART',
  'BAR_CHART',
  'PIE_CHART',
  'AREA_CHART',
  'TABLE',
  'KPI',
  'HEATMAP',
  'LIST'
);

CREATE TABLE IF NOT EXISTS "saved_reports" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "report_type" "ReportType" NOT NULL,
  "filters" JSONB NOT NULL DEFAULT '{}',
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "created_by_staff_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "dashboard_widgets" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "widget_type" "WidgetType" NOT NULL,
  "position_x" INTEGER NOT NULL DEFAULT 0,
  "position_y" INTEGER NOT NULL DEFAULT 0,
  "width" INTEGER NOT NULL DEFAULT 4,
  "height" INTEGER NOT NULL DEFAULT 2,
  "configuration" JSONB NOT NULL DEFAULT '{}',
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "saved_reports_business_id_report_type_idx"
  ON "saved_reports"("business_id", "report_type");
CREATE INDEX IF NOT EXISTS "dashboard_widgets_business_id_display_order_idx"
  ON "dashboard_widgets"("business_id", "display_order");

ALTER TABLE "saved_reports" DROP CONSTRAINT IF EXISTS "saved_reports_business_id_fkey";
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_reports" DROP CONSTRAINT IF EXISTS "saved_reports_created_by_staff_id_fkey";
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_created_by_staff_id_fkey"
  FOREIGN KEY ("created_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dashboard_widgets" DROP CONSTRAINT IF EXISTS "dashboard_widgets_business_id_fkey";
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
