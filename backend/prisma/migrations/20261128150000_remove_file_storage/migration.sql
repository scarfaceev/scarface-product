-- Remove file metadata and references while retaining Product and JobApplication records.
ALTER TABLE "Product" DROP CONSTRAINT "Product_datasheetMediaId_fkey";
ALTER TABLE "ProductMedia" DROP CONSTRAINT "ProductMedia_productId_fkey";
ALTER TABLE "ProductMedia" DROP CONSTRAINT "ProductMedia_mediaAssetId_fkey";
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_resumeMediaId_fkey";

ALTER TABLE "Product" DROP COLUMN "datasheetMediaId";
ALTER TABLE "JobApplication" DROP COLUMN "resumeMediaId";

DROP TABLE "ProductMedia";
DROP TABLE "MediaAsset";

DROP TYPE "MediaKind";
DROP TYPE "MediaVisibility";
