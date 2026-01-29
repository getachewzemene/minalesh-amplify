/*
  Warnings:

  - Changed the type of `announcementId` on the `feature_announcement_reads` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'pending_signature', 'active', 'expired', 'terminated', 'renewed');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('standard', 'premium', 'enterprise', 'custom');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('pending', 'signed', 'rejected');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('active', 'archived', 'closed');

-- CreateEnum
CREATE TYPE "GroupPurchaseStatus" AS ENUM ('active', 'completed', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "EqubCircleStatus" AS ENUM ('active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "EqubDistributionStatus" AS ENUM ('pending', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'sent_to_supplier', 'partially_received', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('spin_wheel', 'scratch_card', 'quiz', 'survey', 'mini_game');

-- DropForeignKey
ALTER TABLE "feature_announcement_reads" DROP CONSTRAINT "feature_announcement_reads_announcementId_fkey";

-- AlterTable
ALTER TABLE "feature_announcement_reads" DROP COLUMN "announcementId",
ADD COLUMN     "announcementId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "contract_type" "ContractType" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_contracts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "template_id" UUID,
    "contract_number" TEXT NOT NULL,
    "contract_type" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "parent_contract_id" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "renewal_period_months" INTEGER,
    "commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "payment_terms" TEXT,
    "document_url" TEXT,
    "termination_date" TIMESTAMP(3),
    "termination_reason" TEXT,
    "terminated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "signed_at" TIMESTAMP(3),

    CONSTRAINT "vendor_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "signer_id" UUID NOT NULL,
    "signer_role" TEXT NOT NULL,
    "status" "SignatureStatus" NOT NULL DEFAULT 'pending',
    "signature_data" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "rejection_reason" TEXT,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_scores" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "algorithm" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "vendorId" UUID,
    "adminId" UUID,
    "productId" UUID,
    "orderId" UUID,
    "subject" TEXT,
    "status" "ChatStatus" NOT NULL DEFAULT 'active',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_searches" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "sessionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "audioUrl" TEXT,
    "transcription" TEXT NOT NULL,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_purchases" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "initiatorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredMembers" INTEGER NOT NULL,
    "currentMembers" INTEGER NOT NULL DEFAULT 1,
    "maxMembers" INTEGER,
    "pricePerPerson" DOUBLE PRECISION NOT NULL,
    "regularPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "GroupPurchaseStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "group_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_purchase_members" (
    "id" UUID NOT NULL,
    "groupPurchaseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAmount" DOUBLE PRECISION,
    "orderId" UUID,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_purchase_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equb_circles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creatorId" UUID NOT NULL,
    "memberLimit" INTEGER NOT NULL,
    "contributionAmount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "totalRounds" INTEGER NOT NULL,
    "status" "EqubCircleStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equb_circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equb_circle_members" (
    "id" UUID NOT NULL,
    "equbCircleId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equb_circle_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equb_contributions" (
    "id" UUID NOT NULL,
    "equbCircleId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equb_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equb_distributions" (
    "id" UUID NOT NULL,
    "equbCircleId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "EqubDistributionStatus" NOT NULL DEFAULT 'pending',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "distributedAt" TIMESTAMP(3),

    CONSTRAINT "equb_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_shares" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "shareUrl" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "social_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_forecasts" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "warehouseId" UUID,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedDemand" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "actualDemand" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "factors" JSONB NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_reorder_rules" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "warehouseId" UUID,
    "reorderPoint" INTEGER NOT NULL,
    "reorderQuantity" INTEGER NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "safetyStock" INTEGER NOT NULL,
    "minOrderQty" INTEGER,
    "maxOrderQty" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_reorder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "supplierName" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'draft',
    "expectedDelivery" TIMESTAMP(3) NOT NULL,
    "actualDelivery" TIMESTAMP(3),
    "autoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "achievementKey" TEXT NOT NULL,
    "achievementName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_check_ins" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "checkInDate" DATE NOT NULL,
    "streakCount" INTEGER NOT NULL DEFAULT 1,
    "reward" INTEGER NOT NULL,
    "bonusReward" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_scores" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "gameType" "GameType" NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "reward" INTEGER NOT NULL,
    "rewardType" TEXT NOT NULL,
    "metadata" JSONB,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sale_registrations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "flashSaleId" UUID NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flash_sale_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stock_counters" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "flashSaleId" UUID,
    "totalStock" INTEGER NOT NULL,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "reservedCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_stock_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_templates_contract_type_idx" ON "contract_templates"("contract_type");

-- CreateIndex
CREATE INDEX "contract_templates_is_active_idx" ON "contract_templates"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_contracts_contract_number_key" ON "vendor_contracts"("contract_number");

-- CreateIndex
CREATE INDEX "vendor_contracts_vendor_id_idx" ON "vendor_contracts"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_contracts_status_idx" ON "vendor_contracts"("status");

-- CreateIndex
CREATE INDEX "vendor_contracts_contract_type_idx" ON "vendor_contracts"("contract_type");

-- CreateIndex
CREATE INDEX "vendor_contracts_end_date_idx" ON "vendor_contracts"("end_date");

-- CreateIndex
CREATE INDEX "vendor_contracts_parent_contract_id_idx" ON "vendor_contracts"("parent_contract_id");

-- CreateIndex
CREATE INDEX "contract_signatures_contract_id_idx" ON "contract_signatures"("contract_id");

-- CreateIndex
CREATE INDEX "contract_signatures_signer_id_idx" ON "contract_signatures"("signer_id");

-- CreateIndex
CREATE INDEX "contract_signatures_status_idx" ON "contract_signatures"("status");

-- CreateIndex
CREATE INDEX "recommendation_scores_userId_score_idx" ON "recommendation_scores"("userId", "score");

-- CreateIndex
CREATE INDEX "recommendation_scores_productId_idx" ON "recommendation_scores"("productId");

-- CreateIndex
CREATE INDEX "recommendation_scores_generatedAt_idx" ON "recommendation_scores"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_scores_userId_productId_algorithm_key" ON "recommendation_scores"("userId", "productId", "algorithm");

-- CreateIndex
CREATE INDEX "chat_conversations_customerId_idx" ON "chat_conversations"("customerId");

-- CreateIndex
CREATE INDEX "chat_conversations_vendorId_idx" ON "chat_conversations"("vendorId");

-- CreateIndex
CREATE INDEX "chat_conversations_adminId_idx" ON "chat_conversations"("adminId");

-- CreateIndex
CREATE INDEX "chat_conversations_status_idx" ON "chat_conversations"("status");

-- CreateIndex
CREATE INDEX "chat_conversations_lastMessageAt_idx" ON "chat_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "chat_messages_isRead_idx" ON "chat_messages"("isRead");

-- CreateIndex
CREATE INDEX "voice_searches_userId_idx" ON "voice_searches"("userId");

-- CreateIndex
CREATE INDEX "voice_searches_language_idx" ON "voice_searches"("language");

-- CreateIndex
CREATE INDEX "voice_searches_createdAt_idx" ON "voice_searches"("createdAt");

-- CreateIndex
CREATE INDEX "group_purchases_productId_idx" ON "group_purchases"("productId");

-- CreateIndex
CREATE INDEX "group_purchases_status_idx" ON "group_purchases"("status");

-- CreateIndex
CREATE INDEX "group_purchases_expiresAt_idx" ON "group_purchases"("expiresAt");

-- CreateIndex
CREATE INDEX "group_purchases_currentMembers_idx" ON "group_purchases"("currentMembers");

-- CreateIndex
CREATE INDEX "group_purchase_members_userId_idx" ON "group_purchase_members"("userId");

-- CreateIndex
CREATE INDEX "group_purchase_members_isPaid_idx" ON "group_purchase_members"("isPaid");

-- CreateIndex
CREATE UNIQUE INDEX "group_purchase_members_groupPurchaseId_userId_key" ON "group_purchase_members"("groupPurchaseId", "userId");

-- CreateIndex
CREATE INDEX "equb_circles_creatorId_idx" ON "equb_circles"("creatorId");

-- CreateIndex
CREATE INDEX "equb_circles_status_idx" ON "equb_circles"("status");

-- CreateIndex
CREATE INDEX "equb_circles_startDate_idx" ON "equb_circles"("startDate");

-- CreateIndex
CREATE INDEX "equb_circle_members_userId_idx" ON "equb_circle_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "equb_circle_members_equbCircleId_userId_key" ON "equb_circle_members"("equbCircleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "equb_circle_members_equbCircleId_position_key" ON "equb_circle_members"("equbCircleId", "position");

-- CreateIndex
CREATE INDEX "equb_contributions_equbCircleId_idx" ON "equb_contributions"("equbCircleId");

-- CreateIndex
CREATE INDEX "equb_contributions_memberId_idx" ON "equb_contributions"("memberId");

-- CreateIndex
CREATE INDEX "equb_contributions_round_idx" ON "equb_contributions"("round");

-- CreateIndex
CREATE INDEX "equb_distributions_equbCircleId_idx" ON "equb_distributions"("equbCircleId");

-- CreateIndex
CREATE INDEX "equb_distributions_recipientId_idx" ON "equb_distributions"("recipientId");

-- CreateIndex
CREATE INDEX "equb_distributions_round_idx" ON "equb_distributions"("round");

-- CreateIndex
CREATE INDEX "equb_distributions_status_idx" ON "equb_distributions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "social_shares_shareCode_key" ON "social_shares"("shareCode");

-- CreateIndex
CREATE INDEX "social_shares_userId_idx" ON "social_shares"("userId");

-- CreateIndex
CREATE INDEX "social_shares_productId_idx" ON "social_shares"("productId");

-- CreateIndex
CREATE INDEX "social_shares_shareCode_idx" ON "social_shares"("shareCode");

-- CreateIndex
CREATE INDEX "social_shares_platform_idx" ON "social_shares"("platform");

-- CreateIndex
CREATE INDEX "inventory_forecasts_forecastDate_idx" ON "inventory_forecasts"("forecastDate");

-- CreateIndex
CREATE INDEX "inventory_forecasts_confidence_idx" ON "inventory_forecasts"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_forecasts_productId_warehouseId_forecastDate_key" ON "inventory_forecasts"("productId", "warehouseId", "forecastDate");

-- CreateIndex
CREATE INDEX "auto_reorder_rules_vendorId_idx" ON "auto_reorder_rules"("vendorId");

-- CreateIndex
CREATE INDEX "auto_reorder_rules_isActive_idx" ON "auto_reorder_rules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "auto_reorder_rules_productId_warehouseId_key" ON "auto_reorder_rules"("productId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_vendorId_idx" ON "purchase_orders"("vendorId");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_expectedDelivery_idx" ON "purchase_orders"("expectedDelivery");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- CreateIndex
CREATE INDEX "user_achievements_earnedAt_idx" ON "user_achievements"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementKey_key" ON "user_achievements"("userId", "achievementKey");

-- CreateIndex
CREATE INDEX "daily_check_ins_userId_idx" ON "daily_check_ins"("userId");

-- CreateIndex
CREATE INDEX "daily_check_ins_checkInDate_idx" ON "daily_check_ins"("checkInDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_ins_userId_checkInDate_key" ON "daily_check_ins"("userId", "checkInDate");

-- CreateIndex
CREATE INDEX "game_scores_userId_idx" ON "game_scores"("userId");

-- CreateIndex
CREATE INDEX "game_scores_gameType_idx" ON "game_scores"("gameType");

-- CreateIndex
CREATE INDEX "game_scores_playedAt_idx" ON "game_scores"("playedAt");

-- CreateIndex
CREATE INDEX "flash_sale_registrations_flashSaleId_idx" ON "flash_sale_registrations"("flashSaleId");

-- CreateIndex
CREATE INDEX "flash_sale_registrations_notified_idx" ON "flash_sale_registrations"("notified");

-- CreateIndex
CREATE UNIQUE INDEX "flash_sale_registrations_userId_flashSaleId_key" ON "flash_sale_registrations"("userId", "flashSaleId");

-- CreateIndex
CREATE INDEX "live_stock_counters_productId_idx" ON "live_stock_counters"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "live_stock_counters_productId_flashSaleId_key" ON "live_stock_counters"("productId", "flashSaleId");

-- CreateIndex
CREATE INDEX "feature_announcement_reads_announcementId_idx" ON "feature_announcement_reads"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_announcement_reads_userId_announcementId_key" ON "feature_announcement_reads"("userId", "announcementId");

-- AddForeignKey
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "contract_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_parent_contract_id_fkey" FOREIGN KEY ("parent_contract_id") REFERENCES "vendor_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "vendor_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_scores" ADD CONSTRAINT "recommendation_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_scores" ADD CONSTRAINT "recommendation_scores_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_searches" ADD CONSTRAINT "voice_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_purchases" ADD CONSTRAINT "group_purchases_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_purchases" ADD CONSTRAINT "group_purchases_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_purchase_members" ADD CONSTRAINT "group_purchase_members_groupPurchaseId_fkey" FOREIGN KEY ("groupPurchaseId") REFERENCES "group_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_purchase_members" ADD CONSTRAINT "group_purchase_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_purchase_members" ADD CONSTRAINT "group_purchase_members_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equb_circles" ADD CONSTRAINT "equb_circles_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equb_circle_members" ADD CONSTRAINT "equb_circle_members_equbCircleId_fkey" FOREIGN KEY ("equbCircleId") REFERENCES "equb_circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equb_circle_members" ADD CONSTRAINT "equb_circle_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equb_contributions" ADD CONSTRAINT "equb_contributions_equbCircleId_fkey" FOREIGN KEY ("equbCircleId") REFERENCES "equb_circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equb_contributions" ADD CONSTRAINT "equb_contributions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "equb_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equb_distributions" ADD CONSTRAINT "equb_distributions_equbCircleId_fkey" FOREIGN KEY ("equbCircleId") REFERENCES "equb_circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equb_distributions" ADD CONSTRAINT "equb_distributions_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_forecasts" ADD CONSTRAINT "inventory_forecasts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_forecasts" ADD CONSTRAINT "inventory_forecasts_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_reorder_rules" ADD CONSTRAINT "auto_reorder_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_reorder_rules" ADD CONSTRAINT "auto_reorder_rules_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_reorder_rules" ADD CONSTRAINT "auto_reorder_rules_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_check_ins" ADD CONSTRAINT "daily_check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_registrations" ADD CONSTRAINT "flash_sale_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_registrations" ADD CONSTRAINT "flash_sale_registrations_flashSaleId_fkey" FOREIGN KEY ("flashSaleId") REFERENCES "flash_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stock_counters" ADD CONSTRAINT "live_stock_counters_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stock_counters" ADD CONSTRAINT "live_stock_counters_flashSaleId_fkey" FOREIGN KEY ("flashSaleId") REFERENCES "flash_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_announcement_reads" ADD CONSTRAINT "feature_announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "feature_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
