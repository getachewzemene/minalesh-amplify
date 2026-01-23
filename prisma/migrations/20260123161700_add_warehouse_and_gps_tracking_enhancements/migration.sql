-- CreateTable: Warehouse for multi-origin delivery tracking
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Ethiopia',
    "postal_code" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "manager_name" TEXT,
    "capacity" INTEGER,
    "operating_hours" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");
CREATE INDEX "warehouses_city_idx" ON "warehouses"("city");
CREATE INDEX "warehouses_is_active_idx" ON "warehouses"("is_active");
CREATE INDEX "warehouses_is_primary_idx" ON "warehouses"("is_primary");

-- AlterTable: Add warehouse_id to orders
ALTER TABLE "orders" ADD COLUMN "warehouse_id" UUID;

-- CreateIndex
CREATE INDEX "orders_warehouse_id_idx" ON "orders"("warehouse_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_warehouse_id_fkey" 
    FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add traffic and route tracking fields to delivery_tracking
ALTER TABLE "delivery_tracking" ADD COLUMN "route_data" JSONB;
ALTER TABLE "delivery_tracking" ADD COLUMN "traffic_conditions" JSONB;
ALTER TABLE "delivery_tracking" ADD COLUMN "estimated_distance_km" DECIMAL(8,2);
ALTER TABLE "delivery_tracking" ADD COLUMN "estimated_duration_min" INTEGER;
ALTER TABLE "delivery_tracking" ADD COLUMN "traffic_delay_min" INTEGER DEFAULT 0;
ALTER TABLE "delivery_tracking" ADD COLUMN "last_route_update" TIMESTAMP(3);
