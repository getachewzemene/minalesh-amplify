-- CreateTable
CREATE TABLE "view_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "view_history_user_id_viewed_at_idx" ON "view_history"("user_id", "viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "view_history_user_id_product_id_key" ON "view_history"("user_id", "product_id");

-- AddForeignKey
ALTER TABLE "view_history" ADD CONSTRAINT "view_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "view_history" ADD CONSTRAINT "view_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
