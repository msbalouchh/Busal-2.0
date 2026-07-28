-- CreateEnum
CREATE TYPE "OrderSessionType" AS ENUM ('DINE_IN');

-- CreateEnum
CREATE TYPE "OrderSessionStatus" AS ENUM ('ACTIVE', 'READY', 'EXPIRED');

-- CreateTable
CREATE TABLE "order_sessions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "qr_menu_session_id" TEXT NOT NULL,
    "session_type" "OrderSessionType" NOT NULL DEFAULT 'DINE_IN',
    "table_id" TEXT,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "order_notes" TEXT,
    "status" "OrderSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_sessions" ADD CONSTRAINT "order_sessions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_sessions" ADD CONSTRAINT "order_sessions_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_sessions" ADD CONSTRAINT "order_sessions_qr_menu_session_id_fkey" FOREIGN KEY ("qr_menu_session_id") REFERENCES "qr_menu_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_sessions" ADD CONSTRAINT "order_sessions_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
