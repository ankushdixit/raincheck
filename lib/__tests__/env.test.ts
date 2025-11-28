/**
 * Environment validation tests for saas_t3 stack
 */

/// <reference types="node" />

describe("Environment Validation", () => {
  // Helper to set NODE_ENV in tests (bypasses readonly restriction)
  const setNodeEnv = (value: string) => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = value;
  };
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  // Helper to set all required env vars
  const setRequiredEnvVars = () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.WEATHER_API_KEY = "test-weather-api-key";
  };

  it("validates when all required variables are present", () => {
    setRequiredEnvVars();
    setNodeEnv("development");

    expect(() => {
      require("../env");
    }).not.toThrow();
  });

  it("exports env object with DATABASE_URL", () => {
    setRequiredEnvVars();
    setNodeEnv("development");
    jest.resetModules();

    const { env } = require("../env");
    expect(env.DATABASE_URL).toBe("postgresql://localhost:5432/test");
  });

  it("exports env object with WEATHER_API_KEY", () => {
    setRequiredEnvVars();
    setNodeEnv("development");
    jest.resetModules();

    const { env } = require("../env");
    expect(env.WEATHER_API_KEY).toBe("test-weather-api-key");
  });

  it("exports env object with NODE_ENV", () => {
    setRequiredEnvVars();
    setNodeEnv("production");
    jest.resetModules();

    const { env } = require("../env");
    expect(env.NODE_ENV).toBe("production");
  });

  it("defaults NODE_ENV to development when not set", () => {
    setRequiredEnvVars();
    (process.env as { NODE_ENV?: string }).NODE_ENV = undefined;
    jest.resetModules();

    const { env } = require("../env");
    expect(env.NODE_ENV).toBe("development");
  });

  it("accepts development NODE_ENV", () => {
    setRequiredEnvVars();
    setNodeEnv("development");
    jest.resetModules();

    expect(() => {
      require("../env");
    }).not.toThrow();
  });

  it("accepts production NODE_ENV", () => {
    setRequiredEnvVars();
    setNodeEnv("production");
    jest.resetModules();

    expect(() => {
      require("../env");
    }).not.toThrow();
  });

  it("accepts test NODE_ENV", () => {
    setRequiredEnvVars();
    setNodeEnv("test");
    jest.resetModules();

    expect(() => {
      require("../env");
    }).not.toThrow();
  });

  it("validates various DATABASE_URL formats", () => {
    const validUrls = [
      "postgresql://localhost:5432/test",
      "postgresql://user:password@localhost:5432/db",
      "mysql://localhost:3306/test",
      "mongodb://localhost:27017/test",
      "https://example.com/db",
    ];

    validUrls.forEach((url) => {
      process.env.DATABASE_URL = url;
      process.env.WEATHER_API_KEY = "test-api-key";
      setNodeEnv("development");
      jest.resetModules();

      expect(() => {
        require("../env");
      }).not.toThrow();
    });
  });

  it("throws error when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    process.env.WEATHER_API_KEY = "test-api-key";
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    expect(() => {
      require("../env");
    }).toThrow("Invalid environment variables");

    consoleErrorSpy.mockRestore();
  });

  it("throws error when DATABASE_URL is empty string", () => {
    process.env.DATABASE_URL = "";
    process.env.WEATHER_API_KEY = "test-api-key";
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    expect(() => {
      require("../env");
    }).toThrow("Invalid environment variables");

    consoleErrorSpy.mockRestore();
  });

  it("throws error when DATABASE_URL is not a valid URL", () => {
    process.env.DATABASE_URL = "not-a-url";
    process.env.WEATHER_API_KEY = "test-api-key";
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    expect(() => {
      require("../env");
    }).toThrow("Invalid environment variables");

    consoleErrorSpy.mockRestore();
  });

  it("throws error when WEATHER_API_KEY is missing", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    delete process.env.WEATHER_API_KEY;
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    expect(() => {
      require("../env");
    }).toThrow("Invalid environment variables");

    consoleErrorSpy.mockRestore();
  });

  it("throws error when WEATHER_API_KEY is empty string", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.WEATHER_API_KEY = "";
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    expect(() => {
      require("../env");
    }).toThrow("Invalid environment variables");

    consoleErrorSpy.mockRestore();
  });

  it("logs error details when validation fails", () => {
    delete process.env.DATABASE_URL;
    delete process.env.WEATHER_API_KEY;
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    try {
      require("../env");
    } catch {
      // Expected to throw
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid environment variables")
    );

    consoleErrorSpy.mockRestore();
  });
});
