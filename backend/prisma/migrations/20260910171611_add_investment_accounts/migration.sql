-- CreateTable
CREATE TABLE "InvestmentAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentAccount_pkey" PRIMARY KEY ("id")
);

-- Add the investmentAccountId column as nullable first
ALTER TABLE "Investment" ADD COLUMN "investmentAccountId" INTEGER;

-- AddForeignKey
ALTER TABLE "InvestmentAccount" ADD CONSTRAINT "InvestmentAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_investmentAccountId_fkey" FOREIGN KEY ("investmentAccountId") REFERENCES "InvestmentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create a default investment account for each user with existing investments
INSERT INTO "InvestmentAccount" ("userId", "name", "accountType", "createdAt", "updatedAt")
SELECT DISTINCT "userId", 'Default Account', 'Brokerage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Investment"
WHERE "userId" NOT IN (SELECT DISTINCT "userId" FROM "InvestmentAccount");

-- Backfill the investmentAccountId for existing investments
UPDATE "Investment" i
SET "investmentAccountId" = (
  SELECT ia."id"
  FROM "InvestmentAccount" ia
  WHERE ia."userId" = i."userId"
  LIMIT 1
)
WHERE i."investmentAccountId" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "Investment" ALTER COLUMN "investmentAccountId" SET NOT NULL;
