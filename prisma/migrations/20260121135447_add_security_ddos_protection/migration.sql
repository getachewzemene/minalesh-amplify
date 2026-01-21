-- CreateTable
CREATE TABLE "ip_whitelist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ip_address" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ip_whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_blacklist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ip_address" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "block_count" INTEGER NOT NULL DEFAULT 0,
    "last_blocked_at" TIMESTAMP(3),

    CONSTRAINT "ip_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ip_address" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "user_agent" TEXT,
    "endpoint" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ip_whitelist_ip_address_key" ON "ip_whitelist"("ip_address");

-- CreateIndex
CREATE INDEX "ip_whitelist_ip_address_idx" ON "ip_whitelist"("ip_address");

-- CreateIndex
CREATE INDEX "ip_whitelist_is_active_idx" ON "ip_whitelist"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ip_blacklist_ip_address_key" ON "ip_blacklist"("ip_address");

-- CreateIndex
CREATE INDEX "ip_blacklist_ip_address_idx" ON "ip_blacklist"("ip_address");

-- CreateIndex
CREATE INDEX "ip_blacklist_is_active_idx" ON "ip_blacklist"("is_active");

-- CreateIndex
CREATE INDEX "ip_blacklist_severity_idx" ON "ip_blacklist"("severity");

-- CreateIndex
CREATE INDEX "security_events_ip_address_idx" ON "security_events"("ip_address");

-- CreateIndex
CREATE INDEX "security_events_event_type_idx" ON "security_events"("event_type");

-- CreateIndex
CREATE INDEX "security_events_severity_idx" ON "security_events"("severity");

-- CreateIndex
CREATE INDEX "security_events_created_at_idx" ON "security_events"("created_at");

-- CreateIndex
CREATE INDEX "security_events_resolved_idx" ON "security_events"("resolved");
