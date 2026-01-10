/**
 * Tests for Public Stats API Endpoint
 *
 * Tests GET and OPTIONS handlers for the public stats endpoint.
 * Verifies response format, CORS headers, caching headers, and error handling.
 */

// Mock next/server before any imports - must be inline due to hoisting
jest.mock("next/server", () => {
  class MockHeaders {
    private map = new Map<string, string>();

    get(name: string): string | null {
      return this.map.get(name) ?? null;
    }

    set(name: string, value: string): this {
      this.map.set(name, value);
      return this;
    }
  }

  class MockNextResponse {
    body: unknown;
    status: number;
    headers: MockHeaders;

    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = new MockHeaders();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }

    async json(): Promise<unknown> {
      return this.body;
    }

    static json(data: unknown, init?: { status?: number }): MockNextResponse {
      return new MockNextResponse(data, init);
    }
  }

  return {
    NextResponse: MockNextResponse,
  };
});

// Mock superjson (prevents ESM issues)
jest.mock("superjson", () => ({
  serialize: (obj: unknown) => ({ json: obj, meta: undefined }),
  deserialize: (payload: { json: unknown }) => payload.json,
  stringify: (obj: unknown) => JSON.stringify(obj),
  parse: (str: string) => JSON.parse(str),
}));

// Mock the database
jest.mock("@/server/db", () => ({
  db: {
    run: {
      findFirst: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

import { GET, OPTIONS } from "../route";
import { db } from "@/server/db";

const mockRunFindFirst = db.run.findFirst as jest.Mock;
const mockRunAggregate = db.run.aggregate as jest.Mock;

// Helper to create mock Request
function createMockRequest(
  url: string,
  options?: { method?: string; headers?: Record<string, string> }
): Request {
  const headers = new Headers(options?.headers);
  return {
    headers: {
      get: (name: string) => headers.get(name),
    },
    method: options?.method ?? "GET",
    url,
  } as unknown as Request;
}

describe("Public Stats API - /api/public/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET handler", () => {
    describe("successful responses", () => {
      it("returns stats in correct format", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 15.5 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 45 },
          _sum: { distance: 312.5 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty("longestRun", 15.5);
        expect(data).toHaveProperty("longestRunUnit", "km");
        expect(data).toHaveProperty("totalRuns", 45);
        expect(data).toHaveProperty("totalDistance", 312.5);
        expect(data).toHaveProperty("updatedAt");
      });

      it("returns updatedAt as valid ISO timestamp", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 10 },
          _sum: { distance: 100 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);
        const data = (await response.json()) as { updatedAt: string };

        // Verify ISO timestamp format
        const timestamp = new Date(data.updatedAt);
        expect(timestamp.toISOString()).toBe(data.updatedAt);
      });

      it("rounds totalDistance to 2 decimal places", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 12 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 123.456789 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);
        const data = (await response.json()) as { totalDistance: number };

        expect(data.totalDistance).toBe(123.46);
      });

      it("returns zeros when no runs exist", async () => {
        mockRunFindFirst.mockResolvedValue(null);
        mockRunAggregate.mockResolvedValue({
          _count: { id: 0 },
          _sum: { distance: null },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);
        const data = (await response.json()) as {
          longestRun: number;
          totalRuns: number;
          totalDistance: number;
          longestRunUnit: string;
        };

        expect(response.status).toBe(200);
        expect(data.longestRun).toBe(0);
        expect(data.totalRuns).toBe(0);
        expect(data.totalDistance).toBe(0);
        expect(data.longestRunUnit).toBe("km");
      });

      it("handles null distance sum correctly", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 5 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 1 },
          _sum: { distance: null },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);
        const data = (await response.json()) as { totalDistance: number };

        expect(data.totalDistance).toBe(0);
      });

      it("handles null count correctly", async () => {
        mockRunFindFirst.mockResolvedValue(null);
        mockRunAggregate.mockResolvedValue({
          _count: { id: null },
          _sum: { distance: null },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);
        const data = (await response.json()) as { totalRuns: number };

        expect(data.totalRuns).toBe(0);
      });
    });

    describe("CORS headers", () => {
      it("sets CORS headers for allowed origin ankushdixit.com", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 50 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          headers: { Origin: "https://ankushdixit.com" },
        });
        const response = await GET(request);

        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://ankushdixit.com");
        expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
        expect(response.headers.get("Access-Control-Allow-Headers")).toBe("X-API-Key");
      });

      it("sets CORS headers for allowed origin www.ankushdixit.com", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 50 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          headers: { Origin: "https://www.ankushdixit.com" },
        });
        const response = await GET(request);

        expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
          "https://www.ankushdixit.com"
        );
      });

      it("sets CORS headers for localhost:3000 (development)", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 50 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          headers: { Origin: "http://localhost:3000" },
        });
        const response = await GET(request);

        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
      });

      it("does not set Access-Control-Allow-Origin for disallowed origins", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 50 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          headers: { Origin: "https://malicious-site.com" },
        });
        const response = await GET(request);

        // Should not set the header for disallowed origins
        expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
      });

      it("handles request without Origin header", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 50 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);

        // Should still return data, just no CORS origin header
        expect(response.status).toBe(200);
        expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
      });

      it("always sets Access-Control-Allow-Methods header", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 50 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);

        expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
      });

      it("always sets Access-Control-Allow-Headers header", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 50 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);

        expect(response.headers.get("Access-Control-Allow-Headers")).toBe("X-API-Key");
      });
    });

    describe("cache headers", () => {
      it("sets Cache-Control header with correct values", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 50 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);

        expect(response.headers.get("Cache-Control")).toBe(
          "public, s-maxage=300, stale-while-revalidate=600"
        );
      });

      it("sets cache headers even on error-free empty responses", async () => {
        mockRunFindFirst.mockResolvedValue(null);
        mockRunAggregate.mockResolvedValue({
          _count: { id: 0 },
          _sum: { distance: null },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);

        expect(response.headers.get("Cache-Control")).toBe(
          "public, s-maxage=300, stale-while-revalidate=600"
        );
      });
    });

    describe("error handling", () => {
      it("returns 500 error when database query fails", async () => {
        mockRunFindFirst.mockRejectedValue(new Error("Database connection failed"));
        mockRunAggregate.mockRejectedValue(new Error("Database connection failed"));

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          error: "Internal server error",
          code: "INTERNAL_ERROR",
        });
      });

      it("returns 500 error when findFirst fails", async () => {
        mockRunFindFirst.mockRejectedValue(new Error("Query timeout"));
        mockRunAggregate.mockResolvedValue({
          _count: { id: 5 },
          _sum: { distance: 50 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);
        const data = (await response.json()) as { code: string };

        expect(response.status).toBe(500);
        expect(data.code).toBe("INTERNAL_ERROR");
      });

      it("returns 500 error when aggregate fails", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 10 });
        mockRunAggregate.mockRejectedValue(new Error("Aggregation error"));

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        const response = await GET(request);
        const data = (await response.json()) as { code: string };

        expect(response.status).toBe(500);
        expect(data.code).toBe("INTERNAL_ERROR");
      });

      it("logs error to console on failure", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        mockRunFindFirst.mockRejectedValue(new Error("Test error"));
        mockRunAggregate.mockRejectedValue(new Error("Test error"));

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        await GET(request);

        expect(consoleSpy).toHaveBeenCalledWith(
          "[public/stats] Error fetching stats:",
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });

    describe("database queries", () => {
      it("queries completed runs only for longest run", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 15 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 10 },
          _sum: { distance: 100 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        await GET(request);

        expect(mockRunFindFirst).toHaveBeenCalledWith({
          where: { completed: true },
          orderBy: { distance: "desc" },
          select: { distance: true },
        });
      });

      it("queries completed runs only for aggregates", async () => {
        mockRunFindFirst.mockResolvedValue({ distance: 15 });
        mockRunAggregate.mockResolvedValue({
          _count: { id: 10 },
          _sum: { distance: 100 },
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        await GET(request);

        expect(mockRunAggregate).toHaveBeenCalledWith({
          where: { completed: true },
          _count: { id: true },
          _sum: { distance: true },
        });
      });

      it("executes both queries in parallel", async () => {
        let findFirstCalled = false;
        let aggregateCalled = false;

        mockRunFindFirst.mockImplementation(() => {
          findFirstCalled = true;
          return Promise.resolve({ distance: 10 });
        });

        mockRunAggregate.mockImplementation(() => {
          aggregateCalled = true;
          return Promise.resolve({
            _count: { id: 5 },
            _sum: { distance: 50 },
          });
        });

        const request = createMockRequest("http://localhost:3000/api/public/stats");
        await GET(request);

        // Both should have been called
        expect(findFirstCalled).toBe(true);
        expect(aggregateCalled).toBe(true);
      });
    });
  });

  describe("OPTIONS handler", () => {
    describe("CORS preflight for allowed origins", () => {
      it("returns 204 No Content for preflight requests", async () => {
        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          method: "OPTIONS",
          headers: { Origin: "https://ankushdixit.com" },
        });
        const response = await OPTIONS(request);

        expect(response.status).toBe(204);
      });

      it("sets CORS headers for ankushdixit.com", async () => {
        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          method: "OPTIONS",
          headers: { Origin: "https://ankushdixit.com" },
        });
        const response = await OPTIONS(request);

        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://ankushdixit.com");
        expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
        expect(response.headers.get("Access-Control-Allow-Headers")).toBe("X-API-Key");
      });

      it("sets CORS headers for www.ankushdixit.com", async () => {
        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          method: "OPTIONS",
          headers: { Origin: "https://www.ankushdixit.com" },
        });
        const response = await OPTIONS(request);

        expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
          "https://www.ankushdixit.com"
        );
      });

      it("sets CORS headers for localhost:3000", async () => {
        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          method: "OPTIONS",
          headers: { Origin: "http://localhost:3000" },
        });
        const response = await OPTIONS(request);

        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
      });

      it("returns null body for preflight", async () => {
        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          method: "OPTIONS",
          headers: { Origin: "https://ankushdixit.com" },
        });
        const response = await OPTIONS(request);

        // 204 responses should have null body
        expect(response.body).toBeNull();
      });
    });

    describe("CORS preflight for disallowed origins", () => {
      it("returns empty Access-Control-Allow-Origin for disallowed origins", async () => {
        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          method: "OPTIONS",
          headers: { Origin: "https://evil-site.com" },
        });
        const response = await OPTIONS(request);

        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("");
      });

      it("still returns 204 for disallowed origins", async () => {
        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          method: "OPTIONS",
          headers: { Origin: "https://evil-site.com" },
        });
        const response = await OPTIONS(request);

        expect(response.status).toBe(204);
      });

      it("handles request without Origin header", async () => {
        const request = createMockRequest("http://localhost:3000/api/public/stats", {
          method: "OPTIONS",
        });
        const response = await OPTIONS(request);

        expect(response.status).toBe(204);
        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("");
      });
    });
  });

  describe("integration scenarios", () => {
    it("handles typical portfolio website request flow", async () => {
      mockRunFindFirst.mockResolvedValue({ distance: 21.1 });
      mockRunAggregate.mockResolvedValue({
        _count: { id: 150 },
        _sum: { distance: 1500.75 },
      });

      // First, preflight OPTIONS request
      const preflightRequest = createMockRequest("http://localhost:3000/api/public/stats", {
        method: "OPTIONS",
        headers: {
          Origin: "https://ankushdixit.com",
        },
      });
      const preflightResponse = await OPTIONS(preflightRequest);
      expect(preflightResponse.status).toBe(204);
      expect(preflightResponse.headers.get("Access-Control-Allow-Origin")).toBe(
        "https://ankushdixit.com"
      );

      // Then, actual GET request
      const getRequest = createMockRequest("http://localhost:3000/api/public/stats", {
        headers: {
          Origin: "https://ankushdixit.com",
        },
      });
      const getResponse = await GET(getRequest);
      const data = (await getResponse.json()) as {
        longestRun: number;
        totalRuns: number;
        totalDistance: number;
      };

      expect(getResponse.status).toBe(200);
      expect(data.longestRun).toBe(21.1);
      expect(data.totalRuns).toBe(150);
      expect(data.totalDistance).toBe(1500.75);
    });

    it("handles high-volume statistics correctly", async () => {
      mockRunFindFirst.mockResolvedValue({ distance: 42.195 }); // Marathon distance
      mockRunAggregate.mockResolvedValue({
        _count: { id: 1000 },
        _sum: { distance: 9999.999 },
      });

      const request = createMockRequest("http://localhost:3000/api/public/stats", {
        headers: { Origin: "https://ankushdixit.com" },
      });
      const response = await GET(request);
      const data = (await response.json()) as {
        longestRun: number;
        totalRuns: number;
        totalDistance: number;
      };

      expect(data.longestRun).toBe(42.195);
      expect(data.totalRuns).toBe(1000);
      expect(data.totalDistance).toBe(10000); // Rounded to 2 decimal places
    });

    it("handles very small distances correctly", async () => {
      mockRunFindFirst.mockResolvedValue({ distance: 0.5 });
      mockRunAggregate.mockResolvedValue({
        _count: { id: 1 },
        _sum: { distance: 0.5 },
      });

      const request = createMockRequest("http://localhost:3000/api/public/stats");
      const response = await GET(request);
      const data = (await response.json()) as { longestRun: number; totalDistance: number };

      expect(data.longestRun).toBe(0.5);
      expect(data.totalDistance).toBe(0.5);
    });

    it("handles zero distances correctly", async () => {
      mockRunFindFirst.mockResolvedValue({ distance: 0 });
      mockRunAggregate.mockResolvedValue({
        _count: { id: 1 },
        _sum: { distance: 0 },
      });

      const request = createMockRequest("http://localhost:3000/api/public/stats");
      const response = await GET(request);
      const data = (await response.json()) as { longestRun: number; totalDistance: number };

      expect(data.longestRun).toBe(0);
      expect(data.totalDistance).toBe(0);
    });

    it("handles decimal precision edge cases", async () => {
      mockRunFindFirst.mockResolvedValue({ distance: 10.005 });
      mockRunAggregate.mockResolvedValue({
        _count: { id: 3 },
        _sum: { distance: 30.015 },
      });

      const request = createMockRequest("http://localhost:3000/api/public/stats");
      const response = await GET(request);
      const data = (await response.json()) as { totalDistance: number };

      // Should round to 2 decimal places
      expect(data.totalDistance).toBe(30.02);
    });
  });
});
