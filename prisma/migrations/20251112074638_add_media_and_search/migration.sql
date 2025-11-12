-- Enable pg_trgm extension for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create media table
CREATE TABLE "media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT NOT NULL,
    "optimized_versions" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- Create indexes on media table
CREATE INDEX "media_product_id_idx" ON "media"("product_id");

-- Add foreign key constraint
ALTER TABLE "media" ADD CONSTRAINT "media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create GIN indexes for full-text search on products table
CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN (name gin_trgm_ops);
CREATE INDEX "products_description_trgm_idx" ON "products" USING GIN (description gin_trgm_ops);
CREATE INDEX "products_short_description_trgm_idx" ON "products" USING GIN (short_description gin_trgm_ops);

-- Create composite index for common search filters
CREATE INDEX "products_search_idx" ON "products"("is_active", "price", "rating_average", "created_at");
