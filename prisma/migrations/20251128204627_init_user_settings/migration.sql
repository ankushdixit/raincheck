-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "defaultLocation" TEXT NOT NULL DEFAULT 'Balbriggan, IE',
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 53.6108,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT -6.1817,
    "raceDate" TIMESTAMP(3) NOT NULL DEFAULT '2026-05-17 10:00:00 +00:00',
    "raceName" TEXT NOT NULL DEFAULT 'Life Style Sports Fastlane Summer Edition 2026',
    "targetTime" TEXT NOT NULL DEFAULT '2:00:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);
