-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'confirmed', 'processing', 'packed', 'picked_up', 'in_transit', 'out_for_delivery', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('order', 'payment', 'vendor', 'promotion', 'system');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed_amount', 'free_shipping');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('active', 'inactive', 'expired', 'depleted');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('product_discount', 'category_discount', 'cart_discount', 'buy_x_get_y');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'vendor', 'admin');

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'registered', 'completed', 'expired');

-- CreateEnum
CREATE TYPE "GiftCardStatus" AS ENUM ('active', 'redeemed', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('not_received', 'not_as_described', 'damaged', 'wrong_item', 'refund_issue', 'other');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'pending_vendor_response', 'pending_admin_review', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "DataExportStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('promotional', 'transactional', 'newsletter', 'abandoned_cart', 'welcome_series', 'reengagement');

-- CreateEnum
CREATE TYPE "SubscriptionPlanType" AS ENUM ('premium_monthly', 'premium_yearly', 'subscribe_save');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled', 'expired', 'past_due');

-- CreateEnum
CREATE TYPE "SubscriptionFrequency" AS ENUM ('weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly');

-- CreateEnum
CREATE TYPE "ProtectionClaimType" AS ENUM ('not_received', 'not_as_described', 'auto_refund_sla');

-- CreateEnum
CREATE TYPE "ProtectionClaimStatus" AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "SharePlatform" AS ENUM ('whatsapp', 'facebook', 'twitter', 'telegram', 'copy_link', 'qr_code', 'native');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "email_verified" TIMESTAMP(3),
    "email_verification_token" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expiry" TIMESTAMP(3),
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "lockout_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "display_name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "is_vendor" BOOLEAN NOT NULL DEFAULT false,
    "vendor_status" "VendorStatus" NOT NULL DEFAULT 'pending',
    "trade_license" TEXT,
    "tin_number" TEXT,
    "commission_rate" DECIMAL(5,4) DEFAULT 0.15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'ET',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT,
    "description" TEXT,
    "short_description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "sale_price" DECIMAL(10,2),
    "sku" TEXT,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "weight" DECIMAL(8,2),
    "dimensions" JSONB,
    "images" JSONB NOT NULL DEFAULT '[]',
    "features" JSONB NOT NULL DEFAULT '[]',
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "is_digital" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "sale_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "sale_price" DECIMAL(10,2),
    "sku" TEXT,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "weight" DECIMAL(8,2),
    "dimensions" JSONB,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "session_id" TEXT,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "order_number" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "stripe_session_id" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shipping_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "shipping_address" JSONB,
    "billing_address" JSONB,
    "notes" TEXT,
    "buyer_protection_enabled" BOOLEAN NOT NULL DEFAULT false,
    "protection_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "protection_expires_at" TIMESTAMP(3),
    "insurance_enabled" BOOLEAN NOT NULL DEFAULT false,
    "insurance_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shipping_deadline" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "processing_at" TIMESTAMP(3),
    "packed_at" TIMESTAMP(3),
    "picked_up_at" TIMESTAMP(3),
    "in_transit_at" TIMESTAMP(3),
    "out_for_delivery_at" TIMESTAMP(3),
    "fulfilled_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "estimated_delivery_start" TIMESTAMP(3),
    "estimated_delivery_end" TIMESTAMP(3),
    "delivery_proof_url" TEXT,
    "delivery_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "coupon_id" UUID,
    "promotion_ids" JSONB NOT NULL DEFAULT '[]',
    "shipping_zone_id" UUID,
    "shipping_method_id" UUID,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" "OrderStatus",
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_tracking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "logistics_provider" TEXT,
    "provider_tracking_id" TEXT,
    "provider_webhook_enabled" BOOLEAN NOT NULL DEFAULT false,
    "courier_name" TEXT,
    "courier_phone" TEXT,
    "courier_photo_url" TEXT,
    "courier_vehicle_info" TEXT,
    "current_latitude" DECIMAL(10,8),
    "current_longitude" DECIMAL(11,8),
    "last_location_update" TIMESTAMP(3),
    "location_history" JSONB NOT NULL DEFAULT '[]',
    "estimated_delivery_start" TIMESTAMP(3),
    "estimated_delivery_end" TIMESTAMP(3),
    "actual_delivery_time" TIMESTAMP(3),
    "delivery_proof_photo_url" TEXT,
    "delivery_signature_url" TEXT,
    "delivery_notes" TEXT,
    "recipient_name" TEXT,
    "sms_notifications_sent" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL,
    "event_id" TEXT,
    "order_id" UUID,
    "signature" TEXT,
    "signature_hash" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "latency_ms" INTEGER,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "product_id" UUID,
    "variant_id" UUID,
    "product_name" TEXT NOT NULL,
    "product_sku" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "report_count" INTEGER NOT NULL DEFAULT 0,
    "reported_by" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_sales" DECIMAL(10,2) NOT NULL,
    "commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "payout_amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "session_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "minimum_purchase" DECIMAL(10,2),
    "maximum_discount" DECIMAL(10,2),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "per_user_limit" INTEGER,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "status" "CouponStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id" UUID NOT NULL,
    "user_id" UUID,
    "order_id" UUID NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "promotion_type" "PromotionType" NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "product_ids" JSONB NOT NULL DEFAULT '[]',
    "category_ids" JSONB NOT NULL DEFAULT '[]',
    "minimum_quantity" INTEGER,
    "minimum_purchase" DECIMAL(10,2),
    "buy_quantity" INTEGER,
    "get_quantity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiered_pricing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "min_quantity" INTEGER NOT NULL,
    "max_quantity" INTEGER,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiered_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "product_id" UUID NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "original_price" DECIMAL(10,2) NOT NULL,
    "flash_price" DECIMAL(10,2) NOT NULL,
    "stock_limit" INTEGER,
    "stock_sold" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "countries" JSONB NOT NULL DEFAULT '["ET"]',
    "regions" JSONB NOT NULL DEFAULT '[]',
    "cities" JSONB NOT NULL DEFAULT '[]',
    "postal_codes" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "carrier" TEXT,
    "estimated_days_min" INTEGER,
    "estimated_days_max" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "zone_id" UUID NOT NULL,
    "method_id" UUID NOT NULL,
    "base_rate" DECIMAL(10,2) NOT NULL,
    "per_kg_rate" DECIMAL(10,2),
    "free_shipping_threshold" DECIMAL(10,2),
    "min_order_amount" DECIMAL(10,2),
    "max_order_amount" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rate" DECIMAL(5,4) NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'ET',
    "region" TEXT,
    "city" TEXT,
    "tax_type" TEXT NOT NULL DEFAULT 'VAT',
    "is_compound" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "quantity" INTEGER NOT NULL,
    "user_id" UUID,
    "session_id" TEXT,
    "order_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "provider_refund_id" TEXT,
    "processed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shipping_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pdf_url" TEXT,
    "email_sent_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "tin_number" TEXT,
    "trade_license" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_statements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "payout_id" UUID,
    "statement_number" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_sales" DECIMAL(10,2) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "payout_amount" DECIMAL(10,2) NOT NULL,
    "pdf_url" TEXT,
    "email_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "email_order_confirm" BOOLEAN NOT NULL DEFAULT true,
    "email_shipping_update" BOOLEAN NOT NULL DEFAULT true,
    "email_promotions" BOOLEAN NOT NULL DEFAULT false,
    "email_newsletter" BOOLEAN NOT NULL DEFAULT false,
    "inapp_order_updates" BOOLEAN NOT NULL DEFAULT true,
    "inapp_promotions" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_queue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "template" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_error" TEXT,
    "last_attempt_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "scheduled_for" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

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
    "default_language" TEXT NOT NULL DEFAULT 'en',
    "tax_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "shipping_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "email_marketing" BOOLEAN NOT NULL DEFAULT true,
    "sms_marketing" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lifetime_points" INTEGER NOT NULL DEFAULT 0,
    "tier" "LoyaltyTier" NOT NULL DEFAULT 'bronze',
    "next_tier_points" INTEGER NOT NULL DEFAULT 1000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "related_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referrer_id" UUID NOT NULL,
    "referee_id" UUID,
    "code" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "reward_issued" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "purchaser_id" UUID NOT NULL,
    "recipient_id" UUID,
    "recipient_email" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "status" "GiftCardStatus" NOT NULL DEFAULT 'active',
    "message" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemed_at" TIMESTAMP(3),

    CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "card_id" UUID NOT NULL,
    "order_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_card_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_ratings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "communication" INTEGER NOT NULL,
    "shipping_speed" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "customer_service" INTEGER NOT NULL,
    "overall_rating" DECIMAL(3,2) NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "order_item_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "user_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "type" "DisputeType" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" TEXT[],
    "video_evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "refund_processed" BOOLEAN NOT NULL DEFAULT false,
    "refund_amount" DOUBLE PRECISION,
    "refund_transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispute_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_comparisons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_ids" UUID[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "trade_license_url" TEXT,
    "trade_license_number" TEXT,
    "tin_certificate_url" TEXT,
    "tin_number" TEXT,
    "business_reg_url" TEXT,
    "owner_id_url" TEXT,
    "ocr_verified" BOOLEAN NOT NULL DEFAULT false,
    "ocr_verification_data" JSONB,
    "gov_api_verified" BOOLEAN NOT NULL DEFAULT false,
    "gov_api_verification_data" JSONB,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "next_reverification_at" TIMESTAMP(3),
    "last_reverified_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "status" "DataExportStatus" NOT NULL DEFAULT 'pending',
    "format" TEXT NOT NULL DEFAULT 'json',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_schedule" TEXT,
    "next_run_at" TIMESTAMP(3),
    "download_url" TEXT,
    "file_size" INTEGER,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_job_executions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "records_processed" INTEGER,
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "cron_job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "total_disputes" INTEGER NOT NULL DEFAULT 0,
    "open_disputes" INTEGER NOT NULL DEFAULT 0,
    "resolved_disputes" INTEGER NOT NULL DEFAULT 0,
    "avg_resolution_time_hours" DOUBLE PRECISION,
    "disputes_by_type" JSONB NOT NULL,
    "refunds_processed" INTEGER NOT NULL DEFAULT 0,
    "total_refund_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preview_text" TEXT,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "template_id" TEXT,
    "segment_criteria" JSONB,
    "scheduled_for" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "open_count" INTEGER NOT NULL DEFAULT 0,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "unsubscribe_count" INTEGER NOT NULL DEFAULT 0,
    "bounce_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "user_id" UUID,
    "is_subscribed" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribed_at" TIMESTAMP(3),
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_type" "SubscriptionPlanType" NOT NULL DEFAULT 'premium_monthly',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "price_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "start_date" TIMESTAMP(3) NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "paused_at" TIMESTAMP(3),
    "resume_at" TIMESTAMP(3),
    "stripe_subscription_id" TEXT,
    "payment_method" TEXT,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premium_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "frequency" "SubscriptionFrequency" NOT NULL DEFAULT 'monthly',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "price_at_subscription" DECIMAL(10,2) NOT NULL,
    "next_delivery_date" TIMESTAMP(3) NOT NULL,
    "last_delivery_date" TIMESTAMP(3),
    "shipping_address_id" UUID,
    "delivery_instructions" TEXT,
    "skipped_dates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "paused_at" TIMESTAMP(3),
    "resume_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "total_deliveries" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_subscription_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "delivery_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "premium_subscription_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_health_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metric_type" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "metric_unit" TEXT,
    "threshold" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "metadata" JSONB,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "backup_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "size" BIGINT,
    "location" TEXT,
    "encryption_key" TEXT,
    "checksum" TEXT,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "backup_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metric_type" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 15,
    "notify_email" BOOLEAN NOT NULL DEFAULT true,
    "notify_slack" BOOLEAN NOT NULL DEFAULT false,
    "webhook_url" TEXT,
    "last_triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alert_config_id" UUID NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "percentage" INTEGER DEFAULT 100,
    "target_users" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "commit_hash" TEXT,
    "commit_message" TEXT,
    "deployed_by" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "rollback_of" UUID,
    "smoke_test_passed" BOOLEAN,
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "deployment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "notify_new" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "target_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protection_claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "claim_type" "ProtectionClaimType" NOT NULL,
    "status" "ProtectionClaimStatus" NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requested_refund_amount" DECIMAL(10,2) NOT NULL,
    "approved_refund_amount" DECIMAL(10,2),
    "refund_transaction_id" TEXT,
    "resolution" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protection_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_protection_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "protection_fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "protection_period_days" INTEGER NOT NULL DEFAULT 30,
    "vendor_shipping_sla_hours" INTEGER NOT NULL DEFAULT 72,
    "insurance_threshold_amount" DECIMAL(10,2) NOT NULL DEFAULT 5000,
    "insurance_fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 1.5,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_protection_settings_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_tracking_order_id_key" ON "delivery_tracking"("order_id");

-- CreateIndex
CREATE INDEX "delivery_tracking_logistics_provider_idx" ON "delivery_tracking"("logistics_provider");

-- CreateIndex
CREATE INDEX "delivery_tracking_provider_tracking_id_idx" ON "delivery_tracking"("provider_tracking_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "webhook_events"("provider", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_status_idx" ON "coupons"("status");

-- CreateIndex
CREATE INDEX "coupons_expires_at_idx" ON "coupons"("expires_at");

-- CreateIndex
CREATE INDEX "coupon_usage_coupon_id_idx" ON "coupon_usage"("coupon_id");

-- CreateIndex
CREATE INDEX "coupon_usage_user_id_idx" ON "coupon_usage"("user_id");

-- CreateIndex
CREATE INDEX "coupon_usage_order_id_idx" ON "coupon_usage"("order_id");

-- CreateIndex
CREATE INDEX "promotions_is_active_idx" ON "promotions"("is_active");

-- CreateIndex
CREATE INDEX "promotions_starts_at_ends_at_idx" ON "promotions"("starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "tiered_pricing_product_id_idx" ON "tiered_pricing"("product_id");

-- CreateIndex
CREATE INDEX "flash_sales_product_id_idx" ON "flash_sales"("product_id");

-- CreateIndex
CREATE INDEX "flash_sales_starts_at_ends_at_idx" ON "flash_sales"("starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "shipping_rates_zone_id_method_id_idx" ON "shipping_rates"("zone_id", "method_id");

-- CreateIndex
CREATE INDEX "tax_rates_country_region_city_idx" ON "tax_rates"("country", "region", "city");

-- CreateIndex
CREATE INDEX "tax_rates_is_active_idx" ON "tax_rates"("is_active");

-- CreateIndex
CREATE INDEX "inventory_reservations_product_id_idx" ON "inventory_reservations"("product_id");

-- CreateIndex
CREATE INDEX "inventory_reservations_variant_id_idx" ON "inventory_reservations"("variant_id");

-- CreateIndex
CREATE INDEX "inventory_reservations_user_id_idx" ON "inventory_reservations"("user_id");

-- CreateIndex
CREATE INDEX "inventory_reservations_session_id_idx" ON "inventory_reservations"("session_id");

-- CreateIndex
CREATE INDEX "inventory_reservations_order_id_idx" ON "inventory_reservations"("order_id");

-- CreateIndex
CREATE INDEX "inventory_reservations_status_expires_at_idx" ON "inventory_reservations"("status", "expires_at");

-- CreateIndex
CREATE INDEX "refunds_order_id_idx" ON "refunds"("order_id");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_invoice_number_idx" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_statements_statement_number_key" ON "vendor_statements"("statement_number");

-- CreateIndex
CREATE INDEX "vendor_statements_vendor_id_idx" ON "vendor_statements"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_statements_payout_id_idx" ON "vendor_statements"("payout_id");

-- CreateIndex
CREATE INDEX "media_product_id_idx" ON "media"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "email_queue_status_scheduled_for_idx" ON "email_queue"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "email_queue_created_at_idx" ON "email_queue"("created_at");

-- CreateIndex
CREATE INDEX "commission_ledger_vendor_id_idx" ON "commission_ledger"("vendor_id");

-- CreateIndex
CREATE INDEX "commission_ledger_order_id_idx" ON "commission_ledger"("order_id");

-- CreateIndex
CREATE INDEX "commission_ledger_status_idx" ON "commission_ledger"("status");

-- CreateIndex
CREATE INDEX "commission_ledger_paid_at_idx" ON "commission_ledger"("paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_accounts_user_id_key" ON "loyalty_accounts"("user_id");

-- CreateIndex
CREATE INDEX "loyalty_transactions_account_id_idx" ON "loyalty_transactions"("account_id");

-- CreateIndex
CREATE INDEX "loyalty_transactions_created_at_idx" ON "loyalty_transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_code_key" ON "referrals"("code");

-- CreateIndex
CREATE INDEX "referrals_code_idx" ON "referrals"("code");

-- CreateIndex
CREATE INDEX "referrals_referrer_id_idx" ON "referrals"("referrer_id");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "referrals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_code_key" ON "gift_cards"("code");

-- CreateIndex
CREATE INDEX "gift_cards_code_idx" ON "gift_cards"("code");

-- CreateIndex
CREATE INDEX "gift_cards_status_idx" ON "gift_cards"("status");

-- CreateIndex
CREATE INDEX "gift_card_transactions_card_id_idx" ON "gift_card_transactions"("card_id");

-- CreateIndex
CREATE INDEX "seller_ratings_vendor_id_idx" ON "seller_ratings"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_ratings_order_id_user_id_key" ON "seller_ratings"("order_id", "user_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_user_id_idx" ON "disputes"("user_id");

-- CreateIndex
CREATE INDEX "disputes_vendor_id_idx" ON "disputes"("vendor_id");

-- CreateIndex
CREATE INDEX "disputes_created_at_idx" ON "disputes"("created_at");

-- CreateIndex
CREATE INDEX "disputes_resolved_at_idx" ON "disputes"("resolved_at");

-- CreateIndex
CREATE INDEX "dispute_messages_dispute_id_idx" ON "dispute_messages"("dispute_id");

-- CreateIndex
CREATE INDEX "product_comparisons_user_id_idx" ON "product_comparisons"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_verifications_vendor_id_key" ON "vendor_verifications"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_verifications_status_idx" ON "vendor_verifications"("status");

-- CreateIndex
CREATE INDEX "vendor_verifications_vendor_id_idx" ON "vendor_verifications"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_verifications_next_reverification_at_idx" ON "vendor_verifications"("next_reverification_at");

-- CreateIndex
CREATE INDEX "data_export_requests_user_id_idx" ON "data_export_requests"("user_id");

-- CreateIndex
CREATE INDEX "data_export_requests_status_idx" ON "data_export_requests"("status");

-- CreateIndex
CREATE INDEX "data_export_requests_expires_at_idx" ON "data_export_requests"("expires_at");

-- CreateIndex
CREATE INDEX "data_export_requests_is_recurring_idx" ON "data_export_requests"("is_recurring");

-- CreateIndex
CREATE INDEX "data_export_requests_next_run_at_idx" ON "data_export_requests"("next_run_at");

-- CreateIndex
CREATE INDEX "cron_job_executions_job_name_idx" ON "cron_job_executions"("job_name");

-- CreateIndex
CREATE INDEX "cron_job_executions_status_idx" ON "cron_job_executions"("status");

-- CreateIndex
CREATE INDEX "cron_job_executions_started_at_idx" ON "cron_job_executions"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_analytics_date_key" ON "dispute_analytics"("date");

-- CreateIndex
CREATE INDEX "dispute_analytics_date_idx" ON "dispute_analytics"("date");

-- CreateIndex
CREATE INDEX "email_campaigns_status_scheduled_for_idx" ON "email_campaigns"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "email_campaigns_created_at_idx" ON "email_campaigns"("created_at");

-- CreateIndex
CREATE INDEX "email_subscriptions_user_id_idx" ON "email_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "email_subscriptions_is_subscribed_idx" ON "email_subscriptions"("is_subscribed");

-- CreateIndex
CREATE UNIQUE INDEX "email_subscriptions_email_key" ON "email_subscriptions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "premium_subscriptions_user_id_key" ON "premium_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "premium_subscriptions_stripe_subscription_id_key" ON "premium_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "premium_subscriptions_status_idx" ON "premium_subscriptions"("status");

-- CreateIndex
CREATE INDEX "premium_subscriptions_current_period_end_idx" ON "premium_subscriptions"("current_period_end");

-- CreateIndex
CREATE INDEX "product_subscriptions_user_id_idx" ON "product_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "product_subscriptions_product_id_idx" ON "product_subscriptions"("product_id");

-- CreateIndex
CREATE INDEX "product_subscriptions_status_idx" ON "product_subscriptions"("status");

-- CreateIndex
CREATE INDEX "product_subscriptions_next_delivery_date_idx" ON "product_subscriptions"("next_delivery_date");

-- CreateIndex
CREATE INDEX "subscription_orders_product_subscription_id_idx" ON "subscription_orders"("product_subscription_id");

-- CreateIndex
CREATE INDEX "subscription_orders_order_id_idx" ON "subscription_orders"("order_id");

-- CreateIndex
CREATE INDEX "subscription_payments_premium_subscription_id_idx" ON "subscription_payments"("premium_subscription_id");

-- CreateIndex
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments"("status");

-- CreateIndex
CREATE INDEX "system_health_metrics_metric_type_idx" ON "system_health_metrics"("metric_type");

-- CreateIndex
CREATE INDEX "system_health_metrics_recorded_at_idx" ON "system_health_metrics"("recorded_at");

-- CreateIndex
CREATE INDEX "system_health_metrics_status_idx" ON "system_health_metrics"("status");

-- CreateIndex
CREATE INDEX "backup_records_backup_type_idx" ON "backup_records"("backup_type");

-- CreateIndex
CREATE INDEX "backup_records_status_idx" ON "backup_records"("status");

-- CreateIndex
CREATE INDEX "backup_records_expires_at_idx" ON "backup_records"("expires_at");

-- CreateIndex
CREATE INDEX "alert_configs_metric_type_idx" ON "alert_configs"("metric_type");

-- CreateIndex
CREATE INDEX "alert_configs_is_enabled_idx" ON "alert_configs"("is_enabled");

-- CreateIndex
CREATE INDEX "alert_history_alert_config_id_idx" ON "alert_history"("alert_config_id");

-- CreateIndex
CREATE INDEX "alert_history_acknowledged_idx" ON "alert_history"("acknowledged");

-- CreateIndex
CREATE INDEX "alert_history_created_at_idx" ON "alert_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_key_idx" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_is_enabled_idx" ON "feature_flags"("is_enabled");

-- CreateIndex
CREATE INDEX "deployment_records_environment_idx" ON "deployment_records"("environment");

-- CreateIndex
CREATE INDEX "deployment_records_status_idx" ON "deployment_records"("status");

-- CreateIndex
CREATE INDEX "deployment_records_started_at_idx" ON "deployment_records"("started_at");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE INDEX "price_alerts_user_id_idx" ON "price_alerts"("user_id");

-- CreateIndex
CREATE INDEX "price_alerts_product_id_idx" ON "price_alerts"("product_id");

-- CreateIndex
CREATE INDEX "price_alerts_is_active_triggered_idx" ON "price_alerts"("is_active", "triggered");

-- CreateIndex
CREATE UNIQUE INDEX "price_alerts_user_id_product_id_key" ON "price_alerts"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "protection_claims_order_id_idx" ON "protection_claims"("order_id");

-- CreateIndex
CREATE INDEX "protection_claims_user_id_idx" ON "protection_claims"("user_id");

-- CreateIndex
CREATE INDEX "protection_claims_status_idx" ON "protection_claims"("status");

-- CreateIndex
CREATE INDEX "protection_claims_created_at_idx" ON "protection_claims"("created_at");

-- CreateIndex
CREATE INDEX "product_shares_product_id_idx" ON "product_shares"("product_id");

-- CreateIndex
CREATE INDEX "product_shares_user_id_idx" ON "product_shares"("user_id");

-- CreateIndex
CREATE INDEX "product_shares_platform_idx" ON "product_shares"("platform");

-- CreateIndex
CREATE INDEX "product_shares_created_at_idx" ON "product_shares"("created_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_zone_id_fkey" FOREIGN KEY ("shipping_zone_id") REFERENCES "shipping_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_method_id_fkey" FOREIGN KEY ("shipping_method_id") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payouts" ADD CONSTRAINT "vendor_payouts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiered_pricing" ADD CONSTRAINT "tiered_pricing_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sales" ADD CONSTRAINT "flash_sales_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "shipping_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_method_id_fkey" FOREIGN KEY ("method_id") REFERENCES "shipping_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_statements" ADD CONSTRAINT "vendor_statements_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_statements" ADD CONSTRAINT "vendor_statements_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "vendor_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchaser_id_fkey" FOREIGN KEY ("purchaser_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "gift_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_ratings" ADD CONSTRAINT "seller_ratings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_ratings" ADD CONSTRAINT "seller_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_ratings" ADD CONSTRAINT "seller_ratings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_comparisons" ADD CONSTRAINT "product_comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_subscriptions" ADD CONSTRAINT "email_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_subscriptions" ADD CONSTRAINT "premium_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_orders" ADD CONSTRAINT "subscription_orders_product_subscription_id_fkey" FOREIGN KEY ("product_subscription_id") REFERENCES "product_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_orders" ADD CONSTRAINT "subscription_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_premium_subscription_id_fkey" FOREIGN KEY ("premium_subscription_id") REFERENCES "premium_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_config_id_fkey" FOREIGN KEY ("alert_config_id") REFERENCES "alert_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protection_claims" ADD CONSTRAINT "protection_claims_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_shares" ADD CONSTRAINT "product_shares_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_shares" ADD CONSTRAINT "product_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
