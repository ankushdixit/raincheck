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
  // Note: WEATHER_API_KEY is now optional since we use Open-Meteo (free, no key needed)
  const setRequiredEnvVars = () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.NEXTAUTH_SECRET = "test-secret-must-be-at-least-32-characters-long";
    process.env.AUTH_PASSWORD = "test-password-123";
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

  it("exports env object with optional WEATHER_API_KEY when provided", () => {
    setRequiredEnvVars();
    process.env.WEATHER_API_KEY = "test-weather-api-key";
    setNodeEnv("development");
    jest.resetModules();

    const { env } = require("../env");
    expect(env.WEATHER_API_KEY).toBe("test-weather-api-key");
  });

  it("validates without WEATHER_API_KEY (Open-Meteo is used by default)", () => {
    setRequiredEnvVars();
    delete process.env.WEATHER_API_KEY;
    setNodeEnv("development");
    jest.resetModules();

    expect(() => {
      require("../env");
    }).not.toThrow();
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
      process.env.NEXTAUTH_SECRET = "test-secret-must-be-at-least-32-characters-long";
      process.env.AUTH_PASSWORD = "test-password-123";
      setNodeEnv("development");
      jest.resetModules();

      expect(() => {
        require("../env");
      }).not.toThrow();
    });
  });

  it("exports env object with NEXTAUTH_SECRET", () => {
    setRequiredEnvVars();
    setNodeEnv("development");
    jest.resetModules();

    const { env } = require("../env");
    expect(env.NEXTAUTH_SECRET).toBe("test-secret-must-be-at-least-32-characters-long");
  });

  it("exports env object with AUTH_PASSWORD", () => {
    setRequiredEnvVars();
    setNodeEnv("development");
    jest.resetModules();

    const { env } = require("../env");
    expect(env.AUTH_PASSWORD).toBe("test-password-123");
  });

  it("throws error when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    process.env.NEXTAUTH_SECRET = "test-secret-must-be-at-least-32-characters-long";
    process.env.AUTH_PASSWORD = "test-password-123";
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
    process.env.NEXTAUTH_SECRET = "test-secret-must-be-at-least-32-characters-long";
    process.env.AUTH_PASSWORD = "test-password-123";
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
    process.env.NEXTAUTH_SECRET = "test-secret-must-be-at-least-32-characters-long";
    process.env.AUTH_PASSWORD = "test-password-123";
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
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_PASSWORD;
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

  it("throws error when NEXTAUTH_SECRET is missing", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    delete process.env.NEXTAUTH_SECRET;
    process.env.AUTH_PASSWORD = "test-password-123";
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    expect(() => {
      require("../env");
    }).toThrow("Invalid environment variables");

    consoleErrorSpy.mockRestore();
  });

  it("throws error when NEXTAUTH_SECRET is too short", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.NEXTAUTH_SECRET = "short"; // Less than 32 characters
    process.env.AUTH_PASSWORD = "test-password-123";
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    expect(() => {
      require("../env");
    }).toThrow("Invalid environment variables");

    consoleErrorSpy.mockRestore();
  });

  it("throws error when AUTH_PASSWORD is missing", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.NEXTAUTH_SECRET = "test-secret-must-be-at-least-32-characters-long";
    delete process.env.AUTH_PASSWORD;
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    expect(() => {
      require("../env");
    }).toThrow("Invalid environment variables");

    consoleErrorSpy.mockRestore();
  });

  it("throws error when AUTH_PASSWORD is too short", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.NEXTAUTH_SECRET = "test-secret-must-be-at-least-32-characters-long";
    process.env.AUTH_PASSWORD = "short"; // Less than 8 characters
    setNodeEnv("development");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    jest.resetModules();

    expect(() => {
      require("../env");
    }).toThrow("Invalid environment variables");

    consoleErrorSpy.mockRestore();
  });

  it("accepts optional NEXTAUTH_URL", () => {
    setRequiredEnvVars();
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    setNodeEnv("development");
    jest.resetModules();

    const { env } = require("../env");
    expect(env.NEXTAUTH_URL).toBe("http://localhost:3000");
  });

  it("validates without NEXTAUTH_URL", () => {
    setRequiredEnvVars();
    delete process.env.NEXTAUTH_URL;
    setNodeEnv("development");
    jest.resetModules();

    expect(() => {
      require("../env");
    }).not.toThrow();
  });
});
