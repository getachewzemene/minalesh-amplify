-- CreateEnum for Beta Feedback
CREATE TYPE "FeedbackType" AS ENUM ('bug', 'feature_request', 'improvement', 'usability', 'performance', 'other');
CREATE TYPE "FeedbackStatus" AS ENUM ('new', 'under_review', 'planned', 'in_progress', 'completed', 'rejected');
CREATE TYPE "FeedbackPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- BetaFeedback table
CREATE TABLE "beta_feedback" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "type" "FeedbackType" NOT NULL,
    "priority" "FeedbackPriority" NOT NULL DEFAULT 'medium',
    "status" "FeedbackStatus" NOT NULL DEFAULT 'new',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "page" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "screenshot" TEXT,
    "email" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beta_feedback_pkey" PRIMARY KEY ("id")
);

-- BetaTester table
CREATE TABLE "beta_testers" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "inviteCode" TEXT,
    "invitedBy" UUID,
    "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "notificationOptIn" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beta_testers_pkey" PRIMARY KEY ("id")
);

-- FeatureAnnouncement table
CREATE TABLE "feature_announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_announcements_pkey" PRIMARY KEY ("id")
);

-- FeatureAnnouncementRead table
CREATE TABLE "feature_announcement_reads" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "announcementId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_announcement_reads_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "beta_testers_userId_key" ON "beta_testers"("userId");
CREATE UNIQUE INDEX "beta_testers_inviteCode_key" ON "beta_testers"("inviteCode");
CREATE UNIQUE INDEX "feature_announcement_reads_userId_announcementId_key" ON "feature_announcement_reads"("userId", "announcementId");

-- Create indexes for better query performance
CREATE INDEX "beta_feedback_status_idx" ON "beta_feedback"("status");
CREATE INDEX "beta_feedback_type_idx" ON "beta_feedback"("type");
CREATE INDEX "beta_feedback_priority_idx" ON "beta_feedback"("priority");
CREATE INDEX "beta_feedback_userId_idx" ON "beta_feedback"("userId");
CREATE INDEX "beta_feedback_createdAt_idx" ON "beta_feedback"("createdAt");
CREATE INDEX "beta_testers_active_idx" ON "beta_testers"("active");
CREATE INDEX "beta_testers_enrolledAt_idx" ON "beta_testers"("enrolledAt");
CREATE INDEX "feature_announcements_publishedAt_idx" ON "feature_announcements"("publishedAt");
CREATE INDEX "feature_announcements_expiresAt_idx" ON "feature_announcements"("expiresAt");
CREATE INDEX "feature_announcement_reads_userId_idx" ON "feature_announcement_reads"("userId");
CREATE INDEX "feature_announcement_reads_announcementId_idx" ON "feature_announcement_reads"("announcementId");

-- Add foreign keys
ALTER TABLE "beta_feedback" ADD CONSTRAINT "beta_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "beta_testers" ADD CONSTRAINT "beta_testers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_announcement_reads" ADD CONSTRAINT "feature_announcement_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_announcement_reads" ADD CONSTRAINT "feature_announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "feature_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
