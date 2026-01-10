/**
 * Public Stats API Endpoint
 *
 * Provides public training statistics for external consumers (e.g., portfolio website).
 * No authentication required - data is read-only and public.
 *
 * GET /api/public/stats - Returns aggregate training stats
 * OPTIONS /api/public/stats - CORS preflight handler
 */

import { NextResponse } from "next/server";
import { db } from "@/server/db";

const ALLOWED_ORIGINS = [
  "https://ankushdixit.com",
  "https://www.ankushdixit.com",
  "http://localhost:3000",
];

/**
 * GET handler - Returns public training statistics
 */
export async function GET(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  try {
    const [longestRunResult, aggregates] = await Promise.all([
      db.run.findFirst({
        where: { completed: true },
        orderBy: { distance: "desc" },
        select: { distance: true },
      }),
      db.run.aggregate({
        where: { completed: true },
        _count: { id: true },
        _sum: { distance: true },
      }),
    ]);

    const response = NextResponse.json({
      longestRun: longestRunResult?.distance ?? 0,
      longestRunUnit: "km",
      totalRuns: aggregates._count.id ?? 0,
      totalDistance: Math.round((aggregates._sum.distance ?? 0) * 100) / 100,
      updatedAt: new Date().toISOString(),
    });

    // CORS headers
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set("Access-Control-Allow-Headers", "X-API-Key");

    // Cache headers - 5 min cache, 10 min stale-while-revalidate
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

    return response;
  } catch (error) {
    console.error("[public/stats] Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler - CORS preflight
 */
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "X-API-Key",
    },
  });
}
