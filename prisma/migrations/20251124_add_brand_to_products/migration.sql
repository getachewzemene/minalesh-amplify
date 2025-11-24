-- Add brand field to products table
ALTER TABLE "products" ADD COLUMN "brand" TEXT;

-- Create index for brand filtering (GIN index for case-insensitive search)
CREATE INDEX "products_brand_idx" ON "products" USING GIN (brand gin_trgm_ops);
