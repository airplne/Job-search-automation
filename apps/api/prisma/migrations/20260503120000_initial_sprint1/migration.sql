-- Initial Sprint 1 hardening schema
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DELETED', 'SUSPENDED');
CREATE TYPE "ConsentType" AS ENUM ('PRODUCT_BOUNDARIES', 'RESUME_PROCESSING', 'EMAIL_ALERT_INGESTION', 'GENERATED_MATERIALS');
CREATE TYPE "SourceClassification" AS ENUM ('SAFE_FOR_MVP', 'SAFE_WITH_EXPLICIT_USER_CONSENT', 'REQUIRES_LEGAL_REVIEW', 'DO_NOT_BUILD');
CREATE TYPE "AcquisitionMethod" AS ENUM ('manual_user_link', 'csv_upload', 'user_authorized_email_alert', 'official_api', 'browser_extension_user_click', 'scrape', 'indeed_scrape', 'glassdoor_scrape', 'headless_browser', 'platform_automation', 'bulk_content_copy', 'bulk_glassdoor_content_copy', 'captcha_bypass', 'anti_bot_evasion', 'credential_collection', 'cookie_session_replay', 'auto_apply', 'auto_message', 'auto_save_on_platform', 'screening_answer_automation');
CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'ARCHIVED');
CREATE TYPE "GeneratedMaterialStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "timezone" TEXT,
  "privacyRegion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Consent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "consentType" "ConsentType" NOT NULL,
  "version" TEXT NOT NULL,
  "scope" JSONB,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Consent_userId_consentType_revokedAt_idx" ON "Consent"("userId", "consentType", "revokedAt");
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SourcePolicy" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "acquisitionMethod" "AcquisitionMethod" NOT NULL,
  "classification" "SourceClassification" NOT NULL,
  "legalStatus" TEXT NOT NULL,
  "allowedData" TEXT[],
  "disallowedData" TEXT[],
  "retentionNote" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SourcePolicy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SourcePolicy_provider_acquisitionMethod_key" ON "SourcePolicy"("provider", "acquisitionMethod");
CREATE INDEX "SourcePolicy_enabled_classification_idx" ON "SourcePolicy"("enabled", "classification");

CREATE TABLE "SourceEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourcePolicyId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "acquisitionMethod" "AcquisitionMethod" NOT NULL,
  "sourceUrl" TEXT,
  "externalMessageId" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SourceEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SourceEvent_userId_provider_receivedAt_idx" ON "SourceEvent"("userId", "provider", "receivedAt");
ALTER TABLE "SourceEvent" ADD CONSTRAINT "SourceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceEvent" ADD CONSTRAINT "SourceEvent_sourcePolicyId_fkey" FOREIGN KEY ("sourcePolicyId") REFERENCES "SourcePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "JobListing" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceEventId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "location" TEXT,
  "remoteType" TEXT,
  "salaryMin" INTEGER,
  "salaryMax" INTEGER,
  "currency" TEXT,
  "sourceProvider" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "canonicalUrl" TEXT,
  "descriptionSummary" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobListing_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobListing_userId_companyName_title_idx" ON "JobListing"("userId", "companyName", "title");
CREATE INDEX "JobListing_userId_canonicalUrl_idx" ON "JobListing"("userId", "canonicalUrl");
ALTER TABLE "JobListing" ADD CONSTRAINT "JobListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobListing" ADD CONSTRAINT "JobListing_sourceEventId_fkey" FOREIGN KEY ("sourceEventId") REFERENCES "SourceEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Application" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobListingId" TEXT NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'SAVED',
  "notes" TEXT,
  "appliedAt" TIMESTAMP(3),
  "nextActionAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Application_userId_jobListingId_key" ON "Application"("userId", "jobListingId");
CREATE INDEX "Application_userId_status_nextActionAt_idx" ON "Application"("userId", "status", "nextActionAt");
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobListingId_fkey" FOREIGN KEY ("jobListingId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GeneratedMaterial" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobListingId" TEXT,
  "documentType" TEXT NOT NULL,
  "contentUri" TEXT,
  "contentTextDev" TEXT,
  "status" "GeneratedMaterialStatus" NOT NULL DEFAULT 'DRAFT',
  "claimsMap" JSONB,
  "model" TEXT,
  "promptVersion" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GeneratedMaterial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GeneratedMaterial_userId_status_idx" ON "GeneratedMaterial"("userId", "status");
ALTER TABLE "GeneratedMaterial" ADD CONSTRAINT "GeneratedMaterial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedMaterial" ADD CONSTRAINT "GeneratedMaterial_jobListingId_fkey" FOREIGN KEY ("jobListingId") REFERENCES "JobListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "actor" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "metadata" JSONB,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_userId_action_createdAt_idx" ON "AuditLog"("userId", "action", "createdAt");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
