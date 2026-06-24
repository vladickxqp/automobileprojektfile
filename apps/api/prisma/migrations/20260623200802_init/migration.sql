-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('ru', 'en', 'de');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('apple', 'google', 'email');

-- CreateEnum
CREATE TYPE "OwnershipRole" AS ENUM ('owner', 'viewer');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('private', 'carDNA');

-- CreateEnum
CREATE TYPE "VehicleEventType" AS ENUM ('maintenance', 'repair', 'scan', 'expense', 'document', 'incident', 'score');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('insurance', 'techpassport', 'tuv', 'invoice', 'contract', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'email',
    "passwordHash" TEXT,
    "displayName" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'en',
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "engine" TEXT,
    "plate" TEXT,
    "photoUrl" TEXT,
    "mileageKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownerships" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OwnershipRole" NOT NULL DEFAULT 'owner',
    "from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "to" TIMESTAMP(3),

    CONSTRAINT "ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_events" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "VehicleEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "mileageKm" INTEGER,
    "visibility" "Visibility" NOT NULL DEFAULT 'private',
    "payload" JSONB NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "title" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_scans" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "adapterInfo" TEXT,
    "dtcCodes" TEXT[],
    "mileageKm" INTEGER,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dtc_codes" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "system" TEXT,
    "severity" INTEGER,

    CONSTRAINT "dtc_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "reliability_scores" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reliability_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_reports" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "publicSlug" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "sale_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "vehicles_vin_idx" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "ownerships_vehicleId_idx" ON "ownerships"("vehicleId");

-- CreateIndex
CREATE INDEX "ownerships_userId_idx" ON "ownerships"("userId");

-- CreateIndex
CREATE INDEX "vehicle_events_vehicleId_occurredAt_idx" ON "vehicle_events"("vehicleId", "occurredAt");

-- CreateIndex
CREATE INDEX "vehicle_events_vehicleId_type_idx" ON "vehicle_events"("vehicleId", "type");

-- CreateIndex
CREATE INDEX "documents_vehicleId_idx" ON "documents"("vehicleId");

-- CreateIndex
CREATE INDEX "documents_expiresAt_idx" ON "documents"("expiresAt");

-- CreateIndex
CREATE INDEX "diagnostic_scans_vehicleId_idx" ON "diagnostic_scans"("vehicleId");

-- CreateIndex
CREATE INDEX "reliability_scores_vehicleId_idx" ON "reliability_scores"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "sale_reports_publicSlug_key" ON "sale_reports"("publicSlug");

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_events" ADD CONSTRAINT "vehicle_events_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_events" ADD CONSTRAINT "vehicle_events_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_scans" ADD CONSTRAINT "diagnostic_scans_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reliability_scores" ADD CONSTRAINT "reliability_scores_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_reports" ADD CONSTRAINT "sale_reports_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
