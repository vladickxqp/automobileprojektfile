-- Documents 2.0: new document types + structured metadata.

-- AlterEnum: new document categories
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'tax';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'warranty';

-- AlterTable: structured, type-specific metadata (insurer, premium, interval, dealer, …)
ALTER TABLE "documents" ADD COLUMN "meta" JSONB;
