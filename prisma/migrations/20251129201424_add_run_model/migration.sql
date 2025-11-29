-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "pace" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "type" "RunType" NOT NULL,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Run_date_key" ON "Run"("date");

-- CreateIndex
CREATE INDEX "Run_date_idx" ON "Run"("date");

-- CreateIndex
CREATE INDEX "Run_completed_idx" ON "Run"("completed");
