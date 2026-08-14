-- CreateTable
CREATE TABLE "Laptop" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "assignedTo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Laptop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Laptop_assetCode_key" ON "Laptop"("assetCode");
