/**
 * Authentication tests for NextAuth.js configuration
 */

// Type definitions for mock configs
// eslint-disable-next-line no-unused-vars
type AuthorizeFunction = (creds: {
  password?: string;
}) => Promise<{ id: string; name: string; email: string } | null>;

// eslint-disable-next-line no-unused-vars
type JwtCallbackFunction = (args: {
  token: Record<string, unknown>;
  user?: { id: string };
}) => Record<string, unknown>;

// eslint-disable-next-line no-unused-vars
type SessionCallbackFunction = (args: {
  session: { user?: { id?: string; name?: string } };
  token: { id?: string };
}) => { user?: { id?: string; name?: string } };

interface CredentialsConfig {
  authorize: AuthorizeFunction;
  name: string;
  credentials: Record<string, unknown>;
}

interface NextAuthConfig {
  session: { strategy: string };
  pages: { signIn: string };
  callbacks: {
    jwt: JwtCallbackFunction;
    session: SessionCallbackFunction;
  };
}

// Mock environment variables before importing auth module
process.env.DATABASE_URL = "postgresql://localhost:5432/test";
process.env.WEATHER_API_KEY = "test-weather-api-key";
process.env.NEXTAUTH_SECRET = "test-secret-must-be-at-least-32-characters-long";
process.env.AUTH_PASSWORD = "test-password-123";

// Mock next-auth module
jest.mock("next-auth", () => {
  const mockAuth = jest.fn();
  const mockSignIn = jest.fn();
  const mockSignOut = jest.fn();
  const mockHandlers = {
    GET: jest.fn(),
    POST: jest.fn(),
  };

  return jest.fn().mockImplementation((config) => {
    // Store config for testing
    (global as Record<string, unknown>).__nextAuthConfig = config;
    return {
      handlers: mockHandlers,
      signIn: mockSignIn,
      signOut: mockSignOut,
      auth: mockAuth,
    };
  });
});

jest.mock("next-auth/providers/credentials", () => {
  return jest.fn().mockImplementation((config) => {
    // Store credentials config for testing
    (global as Record<string, unknown>).__credentialsConfig = config;
    return { id: "credentials", name: config.name, type: "credentials" };
  });
});

describe("Auth Configuration", () => {
  beforeEach(() => {
    jest.resetModules();
    // Reset mocked configs
    delete (global as Record<string, unknown>).__nextAuthConfig;
    delete (global as Record<string, unknown>).__credentialsConfig;
  });

  it("exports handlers, signIn, signOut, and auth functions", () => {
    const auth = require("../auth");

    expect(auth.handlers).toBeDefined();
    expect(auth.signIn).toBeDefined();
    expect(auth.signOut).toBeDefined();
    expect(auth.auth).toBeDefined();
  });

  it("configures credentials provider with password field", () => {
    require("../auth");

    const credentialsConfig = (global as Record<string, unknown>)
      .__credentialsConfig as CredentialsConfig;

    expect(credentialsConfig).toBeDefined();
    expect(credentialsConfig.name).toBe("Password");
    expect(credentialsConfig.credentials).toHaveProperty("password");
  });

  it("configures JWT session strategy", () => {
    require("../auth");

    const nextAuthConfig = (global as Record<string, unknown>).__nextAuthConfig as NextAuthConfig;

    expect(nextAuthConfig).toBeDefined();
    expect(nextAuthConfig.session).toEqual({ strategy: "jwt" });
  });

  it("configures custom login page", () => {
    require("../auth");

    const nextAuthConfig = (global as Record<string, unknown>).__nextAuthConfig as NextAuthConfig;

    expect(nextAuthConfig).toBeDefined();
    expect(nextAuthConfig.pages).toEqual({ signIn: "/login" });
  });
});

describe("Credentials Provider Authorization", () => {
  beforeEach(() => {
    jest.resetModules();
    delete (global as Record<string, unknown>).__credentialsConfig;
    // Reset AUTH_PASSWORD to known value
    process.env.AUTH_PASSWORD = "test-password-123";
  });

  it("returns user object for valid password", async () => {
    require("../auth");

    const credentialsConfig = (global as Record<string, unknown>)
      .__credentialsConfig as CredentialsConfig;

    const result = await credentialsConfig.authorize({
      password: "test-password-123",
    });

    expect(result).toEqual({
      id: "owner",
      name: "Ankush",
      email: "ankush@raincheck.app",
    });
  });

  it("returns null for invalid password", async () => {
    require("../auth");

    const credentialsConfig = (global as Record<string, unknown>)
      .__credentialsConfig as CredentialsConfig;

    const result = await credentialsConfig.authorize({
      password: "wrong-password",
    });

    expect(result).toBeNull();
  });

  it("returns null for empty password", async () => {
    require("../auth");

    const credentialsConfig = (global as Record<string, unknown>)
      .__credentialsConfig as CredentialsConfig;

    const result = await credentialsConfig.authorize({ password: "" });

    expect(result).toBeNull();
  });

  it("returns null when password is missing from credentials", async () => {
    require("../auth");

    const credentialsConfig = (global as Record<string, unknown>)
      .__credentialsConfig as CredentialsConfig;

    const result = await credentialsConfig.authorize({});

    expect(result).toBeNull();
  });

  it("returns null when AUTH_PASSWORD env var is not set", async () => {
    delete process.env.AUTH_PASSWORD;
    jest.resetModules();

    // Re-mock next-auth after reset
    jest.mock("next-auth", () => {
      return jest.fn().mockImplementation((config) => {
        (global as Record<string, unknown>).__nextAuthConfig = config;
        return {
          handlers: { GET: jest.fn(), POST: jest.fn() },
          signIn: jest.fn(),
          signOut: jest.fn(),
          auth: jest.fn(),
        };
      });
    });

    jest.mock("next-auth/providers/credentials", () => {
      return jest.fn().mockImplementation((config) => {
        (global as Record<string, unknown>).__credentialsConfig = config;
        return { id: "credentials", name: config.name, type: "credentials" };
      });
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    require("../auth");

    const credentialsConfig = (global as Record<string, unknown>)
      .__credentialsConfig as CredentialsConfig;

    const result = await credentialsConfig.authorize({
      password: "any-password",
    });

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith("AUTH_PASSWORD environment variable is not set");

    consoleErrorSpy.mockRestore();
  });
});

describe("JWT and Session Callbacks", () => {
  beforeEach(() => {
    jest.resetModules();
    delete (global as Record<string, unknown>).__nextAuthConfig;
    process.env.AUTH_PASSWORD = "test-password-123";
  });

  it("jwt callback adds user id to token", () => {
    require("../auth");

    const nextAuthConfig = (global as Record<string, unknown>).__nextAuthConfig as NextAuthConfig;

    const token = { sub: "test-sub" };
    const user = { id: "owner" };

    const result = nextAuthConfig.callbacks.jwt({ token, user });

    expect(result.id).toBe("owner");
  });

  it("jwt callback preserves token when no user", () => {
    require("../auth");

    const nextAuthConfig = (global as Record<string, unknown>).__nextAuthConfig as NextAuthConfig;

    const token = { sub: "test-sub", id: "existing-id" };

    const result = nextAuthConfig.callbacks.jwt({ token });

    expect(result.id).toBe("existing-id");
  });

  it("session callback adds user id from token", () => {
    require("../auth");

    const nextAuthConfig = (global as Record<string, unknown>).__nextAuthConfig as NextAuthConfig;

    const session = { user: { name: "Test" } };
    const token = { id: "owner" };

    const result = nextAuthConfig.callbacks.session({ session, token });

    expect(result.user?.id).toBe("owner");
  });
});
