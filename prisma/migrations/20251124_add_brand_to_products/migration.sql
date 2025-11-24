-- Add brand field to products table
ALTER TABLE "products" ADD COLUMN "brand" TEXT;

-- Ensure pg_trgm extension exists (for trigram-based search)
-- Note: This should already exist from migration 20251112074638_add_media_and_search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for brand filtering (GIN index for case-insensitive search)
CREATE INDEX "products_brand_idx" ON "products" USING GIN (brand gin_trgm_ops);
