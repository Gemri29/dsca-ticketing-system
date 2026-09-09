-- CreateTable
CREATE TABLE "SlaDigestRun" (
    "id" TEXT NOT NULL,
    "runDate" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlaDigestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlaDigestRun_runDate_key" ON "SlaDigestRun"("runDate");
