-- AlterTable
ALTER TABLE "reviews" ADD COLUMN "report_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN "reported_by" JSONB NOT NULL DEFAULT '[]';
