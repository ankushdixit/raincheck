-- CreateEnum
CREATE TYPE "RecommendationCategory" AS ENUM ('INJURY_PREVENTION', 'NUTRITION', 'PACING', 'RECOVERY', 'GEAR', 'MENTAL');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "RecommendationCategory" NOT NULL,
    "phase" "Phase",
    "priority" "RecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recommendation_phase_idx" ON "Recommendation"("phase");

-- CreateIndex
CREATE INDEX "Recommendation_category_idx" ON "Recommendation"("category");
