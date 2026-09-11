-- CreateEnum
CREATE TYPE "MaterializationStatus" AS ENUM (
    'NOT_STARTED',
    'READY',
    'RUNNING',
    'REVIEW_REQUIRED',
    'COMPLETED',
    'FAILED'
);

-- CreateEnum
CREATE TYPE "IndexControlScope" AS ENUM (
    'TERRITORIAL_TOTAL',
    'REGION',
    'CITY',
    'ALLIANCE_TOTAL',
    'ALLIANCE'
);

-- CreateEnum
CREATE TYPE "AllianceRelationType" AS ENUM (
    'SUPPORTS',
    'ARTICULATES_FOR',
    'COORDINATES_FOR'
);

-- AlterTable: preserve the legacy binary hash while adding the logical revision.
ALTER TABLE "ImportBatch"
    ADD COLUMN "semanticHash" TEXT,
    ADD COLUMN "parserVersion" TEXT,
    ADD COLUMN "materializationStatus" "MaterializationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    ADD COLUMN "materializedAt" TIMESTAMP(3),
    ADD COLUMN "materializationError" TEXT;

-- CreateTable
CREATE TABLE "ImportArtifact" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportArtifact_pkey" PRIMARY KEY ("id")
);

-- Backfill every binary artifact already represented by a logical batch.
INSERT INTO "ImportArtifact" ("id", "importBatchId", "filename", "fileHash", "observedAt")
SELECT
    'legacy-artifact-' || "id",
    "id",
    "filename",
    "fileHash",
    "createdAt"
FROM "ImportBatch";

-- CreateTable
CREATE TABLE "ImportIndexControl" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "scope" "IndexControlScope" NOT NULL,
    "sourceSheet" TEXT NOT NULL,
    "sourceCell" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "normalizedKey" TEXT NOT NULL,
    "manualCount" INTEGER NOT NULL,
    "observedCount" INTEGER,
    "difference" INTEGER,

    CONSTRAINT "ImportIndexControl_pkey" PRIMARY KEY ("id")
);

-- AlterTable: use a temporary default so existing rows remain valid.
ALTER TABLE "PersonAlliance"
    ADD COLUMN "relationType" "AllianceRelationType" NOT NULL DEFAULT 'SUPPORTS',
    ADD COLUMN "relationKey" TEXT;

WITH relation_keys AS (
    SELECT
        "id",
        "personId" || ':' || "allianceId" || ':' || COALESCE("localityId", '_') || ':SUPPORTS' AS base_key,
        ROW_NUMBER() OVER (
            PARTITION BY "personId", "allianceId", "localityId"
            ORDER BY "createdAt", "id"
        ) AS duplicate_number
    FROM "PersonAlliance"
)
UPDATE "PersonAlliance" AS alliance
SET "relationKey" = CASE
    WHEN relation_keys.duplicate_number = 1 THEN relation_keys.base_key
    ELSE relation_keys.base_key || ':legacy:' || alliance."id"
END
FROM relation_keys
WHERE alliance."id" = relation_keys."id";

ALTER TABLE "PersonAlliance"
    ALTER COLUMN "relationKey" SET NOT NULL,
    ALTER COLUMN "relationType" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_semanticHash_key" ON "ImportBatch"("semanticHash");

-- CreateIndex
CREATE UNIQUE INDEX "ImportArtifact_fileHash_key" ON "ImportArtifact"("fileHash");

-- CreateIndex
CREATE INDEX "ImportArtifact_importBatchId_observedAt_idx" ON "ImportArtifact"("importBatchId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImportIndexControl_source_key" ON "ImportIndexControl"("importBatchId", "scope", "sourceSheet", "sourceCell");

-- CreateIndex
CREATE INDEX "ImportIndexControl_batch_normalizedKey_idx" ON "ImportIndexControl"("importBatchId", "normalizedKey");

-- CreateIndex
CREATE UNIQUE INDEX "PersonAlliance_relationKey_key" ON "PersonAlliance"("relationKey");

-- AddForeignKey
ALTER TABLE "ImportArtifact"
    ADD CONSTRAINT "ImportArtifact_importBatchId_fkey"
    FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportIndexControl"
    ADD CONSTRAINT "ImportIndexControl_importBatchId_fkey"
    FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
