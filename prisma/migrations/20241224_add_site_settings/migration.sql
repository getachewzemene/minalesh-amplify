-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_message" TEXT,
    "featured_products" JSONB,
    "homepage_banners" JSONB,
    "announcement_bar" JSONB,
    "allow_new_vendors" BOOLEAN NOT NULL DEFAULT true,
    "allow_new_customers" BOOLEAN NOT NULL DEFAULT true,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 1000000,
    "default_currency" TEXT NOT NULL DEFAULT 'ETB',
    "tax_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "shipping_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
