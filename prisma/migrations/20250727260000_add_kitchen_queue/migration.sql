-- CreateEnum
CREATE TYPE "KitchenQueuePriority" AS ENUM ('NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "KitchenQueueStation" AS ENUM ('GENERAL');

-- CreateEnum
CREATE TYPE "KitchenQueueStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'PREPARING', 'READY', 'SERVED');

-- CreateTable
CREATE TABLE "kitchen_queue" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "priority" "KitchenQueuePriority" NOT NULL DEFAULT 'NORMAL',
    "station" "KitchenQueueStation" NOT NULL DEFAULT 'GENERAL',
    "status" "KitchenQueueStatus" NOT NULL DEFAULT 'NEW',
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "preparing_at" TIMESTAMP(3),
    "ready_at" TIMESTAMP(3),
    "served_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kitchen_queue_order_id_key" ON "kitchen_queue"("order_id");

-- AddForeignKey
ALTER TABLE "kitchen_queue" ADD CONSTRAINT "kitchen_queue_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitchen_queue" ADD CONSTRAINT "kitchen_queue_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
