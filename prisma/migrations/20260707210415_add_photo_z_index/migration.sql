-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "backgroundImage" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1080,
    "height" INTEGER NOT NULL DEFAULT 1350,
    "photoX" INTEGER NOT NULL DEFAULT 100,
    "photoY" INTEGER NOT NULL DEFAULT 200,
    "photoWidth" INTEGER NOT NULL DEFAULT 880,
    "photoHeight" INTEGER NOT NULL DEFAULT 880,
    "photoRotation" REAL NOT NULL DEFAULT 0.0,
    "photoZIndex" INTEGER NOT NULL DEFAULT -1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "campaignId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Template_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Template" ("backgroundImage", "campaignId", "createdAt", "height", "id", "name", "photoHeight", "photoRotation", "photoWidth", "photoX", "photoY", "status", "updatedAt", "width") SELECT "backgroundImage", "campaignId", "createdAt", "height", "id", "name", "photoHeight", "photoRotation", "photoWidth", "photoX", "photoY", "status", "updatedAt", "width" FROM "Template";
DROP TABLE "Template";
ALTER TABLE "new_Template" RENAME TO "Template";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
