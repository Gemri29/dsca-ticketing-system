-- CreateTable
CREATE TABLE "TicketRead" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketRead_adminId_idx" ON "TicketRead"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketRead_ticketId_adminId_key" ON "TicketRead"("ticketId", "adminId");

-- AddForeignKey
ALTER TABLE "TicketRead" ADD CONSTRAINT "TicketRead_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketRead" ADD CONSTRAINT "TicketRead_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
