/**
 * Seed Recommendations Script
 *
 * Run this to add initial recommendations without affecting other data.
 * Usage: npx tsx scripts/seed-recommendations.ts
 */

import {
  PrismaClient,
  Phase,
  RecommendationCategory,
  RecommendationPriority,
} from "@prisma/client";

const prisma = new PrismaClient();

const recommendationsData = [
  // Injury Prevention - General
  {
    title: "Arch Strengthening Exercises",
    description:
      "Roll a frozen water bottle under your arch for 10-15 minutes after runs. Perform towel scrunches, calf raises, and single-leg balance exercises daily to strengthen the arch and prevent plantar fasciitis.",
    category: RecommendationCategory.INJURY_PREVENTION,
    phase: null,
    priority: RecommendationPriority.HIGH,
    source: "Claude Code training discussion",
  },
  {
    title: "Monitor Shoe Mileage",
    description:
      "Track kilometers on your running shoes. After 500-800 km, the midsole compression reduces support. Consider replacing shoes before they cause injury, especially with increasing long run distances.",
    category: RecommendationCategory.GEAR,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },
  {
    title: "Calf and Plantar Fascia Stretches",
    description:
      "Perform calf stretches and plantar fascia stretches before bed. This helps prevent morning stiffness and reduces risk of arch pain during runs.",
    category: RecommendationCategory.INJURY_PREVENTION,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },

  // Pacing - General
  {
    title: "Negative Split Pacing is Correct",
    description:
      "Your pattern of starting slow (7:40-8:00/km) and finishing faster (6:50-7:00/km average) is excellent and exactly how experienced runners pace themselves. Don't try to 'fix' this - your body is naturally pacing itself well.",
    category: RecommendationCategory.PACING,
    phase: null,
    priority: RecommendationPriority.HIGH,
    source: "Claude Code training discussion",
  },
  {
    title: "The First Mile is a Liar",
    description:
      "Feeling tough in the first 1-3 km is completely normal. Your body needs 10-15 minutes for heart rate to stabilize, blood to redirect to muscles, and joints to lubricate. Trust the process.",
    category: RecommendationCategory.MENTAL,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },

  // Nutrition - Base Building
  {
    title: "Fuel During Long Runs Over 90 Minutes",
    description:
      "After 60-90 minutes of running, glycogen stores deplete significantly. Take 30-60g of carbohydrates (one gel or sports drink) around km 8-9 of your long runs to maintain energy and push through the difficult final kilometers.",
    category: RecommendationCategory.NUTRITION,
    phase: Phase.BASE_BUILDING,
    priority: RecommendationPriority.HIGH,
    source: "Claude Code training discussion",
  },
  {
    title: "Pre-Run Nutrition Timing",
    description:
      "Eat a carb-rich meal (oatmeal, toast, banana) 2-3 hours before long runs. This ensures adequate glycogen stores without stomach discomfort during your run.",
    category: RecommendationCategory.NUTRITION,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },

  // Recovery - General
  {
    title: "Hydration Affects Perceived Effort",
    description:
      "Even mild dehydration significantly increases perceived effort during runs. Ensure adequate hydration in the hours before your run, not just during.",
    category: RecommendationCategory.RECOVERY,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },

  // Mental - Base Building
  {
    title: "The Wall at km 10-11 is the Workout",
    description:
      "That tough phase in the final kilometers of your long runs IS the training stimulus. It's building race-day resilience and teaching your body to run on depleted glycogen. This is exactly what half marathon training is about.",
    category: RecommendationCategory.MENTAL,
    phase: Phase.BASE_BUILDING,
    priority: RecommendationPriority.HIGH,
    source: "Claude Code training discussion",
  },
];

async function main() {
  console.log("🌱 Seeding recommendations...\n");

  // Check if recommendations already exist
  const existingCount = await prisma.recommendation.count();
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing recommendations.`);
    console.log("   Skipping to preserve existing data.\n");
    console.log(
      "   To reset, run: npx prisma db execute --stdin <<< 'DELETE FROM \"Recommendation\";'"
    );
    return;
  }

  // Create recommendations
  for (const data of recommendationsData) {
    const rec = await prisma.recommendation.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        phase: data.phase,
        priority: data.priority,
        source: data.source,
      },
    });
    console.log(`✅ Created: ${rec.title}`);
  }

  console.log(`\n🎉 Done! Created ${recommendationsData.length} recommendations.`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
