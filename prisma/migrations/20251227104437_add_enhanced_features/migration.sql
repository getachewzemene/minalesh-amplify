-- AlterTable: Add new fields to DataExportRequest
ALTER TABLE "data_export_requests" ADD COLUMN "categories" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "data_export_requests" ADD COLUMN "is_recurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "data_export_requests" ADD COLUMN "recurring_schedule" TEXT;
ALTER TABLE "data_export_requests" ADD COLUMN "next_run_at" TIMESTAMP(3);
ALTER TABLE "data_export_requests" ALTER COLUMN "format" SET DEFAULT 'json';

-- Create indexes for DataExportRequest
CREATE INDEX "data_export_requests_is_recurring_idx" ON "data_export_requests"("is_recurring");
CREATE INDEX "data_export_requests_next_run_at_idx" ON "data_export_requests"("next_run_at");

-- AlterTable: Add new fields to Dispute
ALTER TABLE "disputes" ADD COLUMN "order_item_ids" UUID[] DEFAULT ARRAY[]::UUID[];
ALTER TABLE "disputes" ADD COLUMN "video_evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "disputes" ADD COLUMN "refund_processed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "disputes" ADD COLUMN "refund_amount" DOUBLE PRECISION;
ALTER TABLE "disputes" ADD COLUMN "refund_transaction_id" TEXT;

-- Create indexes for Dispute
CREATE INDEX "disputes_created_at_idx" ON "disputes"("created_at");
CREATE INDEX "disputes_resolved_at_idx" ON "disputes"("resolved_at");

-- AlterTable: Add new fields to VendorVerification
ALTER TABLE "vendor_verifications" ADD COLUMN "ocr_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_verifications" ADD COLUMN "ocr_verification_data" JSONB;
ALTER TABLE "vendor_verifications" ADD COLUMN "gov_api_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_verifications" ADD COLUMN "gov_api_verification_data" JSONB;
ALTER TABLE "vendor_verifications" ADD COLUMN "next_reverification_at" TIMESTAMP(3);
ALTER TABLE "vendor_verifications" ADD COLUMN "last_reverified_at" TIMESTAMP(3);

-- Create index for VendorVerification
CREATE INDEX "vendor_verifications_next_reverification_at_idx" ON "vendor_verifications"("next_reverification_at");

-- CreateTable: CronJobExecution
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

-- CreateIndex for CronJobExecution
CREATE INDEX "cron_job_executions_job_name_idx" ON "cron_job_executions"("job_name");
CREATE INDEX "cron_job_executions_status_idx" ON "cron_job_executions"("status");
CREATE INDEX "cron_job_executions_started_at_idx" ON "cron_job_executions"("started_at");

-- CreateTable: DisputeAnalytics
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

-- CreateIndex for DisputeAnalytics
CREATE UNIQUE INDEX "dispute_analytics_date_key" ON "dispute_analytics"("date");
CREATE INDEX "dispute_analytics_date_idx" ON "dispute_analytics"("date");
