/**
 * Tests for health check router
 */
import { createCaller } from "../../root";

// Mock superjson to avoid ES module issues in Jest
jest.mock("superjson", () => ({
  serialize: (obj: unknown) => ({ json: obj, meta: undefined }),
  deserialize: (payload: { json: unknown }) => payload.json,
  stringify: (obj: unknown) => JSON.stringify(obj),
  parse: (str: string) => JSON.parse(str),
}));

describe("Health Router", () => {
  describe("health.check", () => {
    it("returns ok status when database is connected", async () => {
      const mockDb = {
        $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
      };

      const caller = createCaller({
        db: mockDb as never,
        headers: new Headers(),
      });

      const result = await caller.health.check();

      expect(result.status).toBe("ok");
      expect(result.database).toBe("connected");
      expect(result.timestamp).toBeDefined();
      expect(mockDb.$queryRaw).toHaveBeenCalled();
    });

    it("returns error status when database is disconnected", async () => {
      const mockDb = {
        $queryRaw: jest.fn().mockRejectedValue(new Error("Connection failed")),
      };

      const caller = createCaller({
        db: mockDb as never,
        headers: new Headers(),
      });

      const result = await caller.health.check();

      expect(result.status).toBe("error");
      expect(result.database).toBe("disconnected");
      expect(result.timestamp).toBeDefined();
    });

    it("returns timestamp in ISO 8601 format", async () => {
      const mockDb = {
        $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
      };

      const caller = createCaller({
        db: mockDb as never,
        headers: new Headers(),
      });

      const result = await caller.health.check();

      // Validate ISO 8601 format
      const timestamp = new Date(result.timestamp);
      expect(timestamp.toISOString()).toBe(result.timestamp);
    });

    it("includes all required fields in response", async () => {
      const mockDb = {
        $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
      };

      const caller = createCaller({
        db: mockDb as never,
        headers: new Headers(),
      });

      const result = await caller.health.check();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("database");
      expect(result).toHaveProperty("timestamp");
    });
  });
});
