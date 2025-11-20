-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "commission_rate" DECIMAL(5,4) DEFAULT 0.15;

-- CreateTable
CREATE TABLE "commission_ledger" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID,
    "sale_amount" DECIMAL(10,2) NOT NULL,
    "commission_rate" DECIMAL(5,4) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "vendor_payout" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commission_ledger_vendor_id_idx" ON "commission_ledger"("vendor_id");

-- CreateIndex
CREATE INDEX "commission_ledger_order_id_idx" ON "commission_ledger"("order_id");

-- CreateIndex
CREATE INDEX "commission_ledger_status_idx" ON "commission_ledger"("status");

-- CreateIndex
CREATE INDEX "commission_ledger_paid_at_idx" ON "commission_ledger"("paid_at");
