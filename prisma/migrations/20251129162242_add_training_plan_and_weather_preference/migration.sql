-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('LONG_RUN', 'EASY_RUN', 'TEMPO_RUN', 'INTERVAL_RUN', 'RECOVERY_RUN', 'RACE');

-- CreateEnum
CREATE TYPE "Phase" AS ENUM ('BASE_BUILDING', 'BASE_EXTENSION', 'SPEED_DEVELOPMENT', 'PEAK_TAPER');

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL,
    "phase" "Phase" NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "longRunTarget" DOUBLE PRECISION NOT NULL,
    "weeklyMileageTarget" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherPreference" (
    "id" TEXT NOT NULL,
    "runType" "RunType" NOT NULL,
    "maxPrecipitation" DOUBLE PRECISION NOT NULL,
    "maxWindSpeed" DOUBLE PRECISION,
    "minTemperature" DOUBLE PRECISION,
    "maxTemperature" DOUBLE PRECISION,
    "avoidConditions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlan_weekNumber_key" ON "TrainingPlan"("weekNumber");

-- CreateIndex
CREATE INDEX "TrainingPlan_weekStart_idx" ON "TrainingPlan"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherPreference_runType_key" ON "WeatherPreference"("runType");
