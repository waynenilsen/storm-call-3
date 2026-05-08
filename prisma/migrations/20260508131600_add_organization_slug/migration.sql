-- AlterTable: add nullable first so existing rows can be backfilled
ALTER TABLE "Organization" ADD COLUMN "slug" TEXT;

-- Backfill guaranteed-unique slugs (id-based). Renaming the org will refresh slug from the name via the service layer.
UPDATE "Organization" SET "slug" = 'org-' || "id" WHERE "slug" IS NULL;

-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
