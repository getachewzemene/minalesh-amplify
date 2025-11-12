-- Create UserRole enum
CREATE TYPE "UserRole" AS ENUM ('customer', 'vendor', 'admin');

-- Add role column to users table with default 'customer'
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'customer';

-- Add authentication hardening columns
ALTER TABLE "users" ADD COLUMN "email_verification_token" TEXT;
ALTER TABLE "users" ADD COLUMN "password_reset_token" TEXT;
ALTER TABLE "users" ADD COLUMN "password_reset_expiry" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "login_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lockout_until" TIMESTAMP(3);

-- Create notification preferences table
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

-- Add unique constraint on user_id
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- Add foreign key constraint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing users: Set vendor role for users with isVendor=true profiles
UPDATE "users" 
SET "role" = 'vendor' 
WHERE "id" IN (
    SELECT "user_id" FROM "profiles" WHERE "is_vendor" = true
);

-- Set admin role based on ADMIN_EMAILS environment variable (manual step - see migration notes)
-- Admin users will need to be updated manually or through a script after migration

-- Create indexes for auth-related lookups
CREATE INDEX "users_email_verification_token_idx" ON "users"("email_verification_token") WHERE "email_verification_token" IS NOT NULL;
CREATE INDEX "users_password_reset_token_idx" ON "users"("password_reset_token") WHERE "password_reset_token" IS NOT NULL;
CREATE INDEX "users_lockout_until_idx" ON "users"("lockout_until") WHERE "lockout_until" IS NOT NULL;
