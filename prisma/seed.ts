/**
 * Database Seed Script
 *
 * Seeds the database with initial data for the RainCheck application.
 * This creates the singleton UserSettings record with default values.
 *
 * Usage:
 *   npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create or update UserSettings (singleton pattern - upsert to ensure only one record)
  const userSettings = await prisma.userSettings.upsert({
    where: { id: "default-settings" },
    update: {},
    create: {
      id: "default-settings",
      defaultLocation: "Balbriggan, IE",
      latitude: 53.6108,
      longitude: -6.1817,
      raceDate: new Date("2026-05-17T10:00:00.000Z"),
      raceName: "Life Style Sports Fastlane Summer Edition 2026",
      targetTime: "2:00:00",
    },
  });

  console.log("✅ UserSettings created:", userSettings);
  console.log("🌱 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
