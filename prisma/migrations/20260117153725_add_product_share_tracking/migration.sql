-- CreateEnum
CREATE TYPE "SharePlatform" AS ENUM ('whatsapp', 'facebook', 'twitter', 'telegram', 'copy_link', 'qr_code', 'native');

-- CreateTable
CREATE TABLE "product_shares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "user_id" UUID,
    "platform" "SharePlatform" NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_shares_product_id_idx" ON "product_shares"("product_id");

-- CreateIndex
CREATE INDEX "product_shares_user_id_idx" ON "product_shares"("user_id");

-- CreateIndex
CREATE INDEX "product_shares_platform_idx" ON "product_shares"("platform");

-- CreateIndex
CREATE INDEX "product_shares_created_at_idx" ON "product_shares"("created_at");

-- AddForeignKey
ALTER TABLE "product_shares" ADD CONSTRAINT "product_shares_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_shares" ADD CONSTRAINT "product_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
