CREATE EXTENSION IF NOT EXISTS "unaccent";

ALTER TABLE "LocalityAlias" ADD COLUMN "valueNormalized" TEXT;

ALTER TABLE "LocalityAlias"
ADD COLUMN "status" "RecordStatus" NOT NULL DEFAULT 'PENDING_REVIEW';

UPDATE "LocalityAlias"
SET "valueNormalized" = UPPER(REGEXP_REPLACE(BTRIM(unaccent("value")), '\s+', ' ', 'g'))
WHERE "valueNormalized" IS NULL;

ALTER TABLE "LocalityAlias" ALTER COLUMN "valueNormalized" SET NOT NULL;

CREATE UNIQUE INDEX "LocalityAlias_localityId_valueNormalized_key"
ON "LocalityAlias"("localityId", "valueNormalized");

CREATE INDEX "LocalityAlias_valueNormalized_idx"
ON "LocalityAlias"("valueNormalized");
