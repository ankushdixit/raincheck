/**
 * useIsAuthenticated hook tests
 */

import { renderHook } from "@testing-library/react";
import { useIsAuthenticated } from "../useIsAuthenticated";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Import the mock to control it in tests
import { useSession } from "next-auth/react";

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("useIsAuthenticated", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isAuthenticated=true when status is authenticated", () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "owner", name: "Ankush" }, expires: "" },
      update: jest.fn(),
    });

    const { result } = renderHook(() => useIsAuthenticated());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns isAuthenticated=false when status is unauthenticated", () => {
    mockUseSession.mockReturnValue({
      status: "unauthenticated",
      data: null,
      update: jest.fn(),
    });

    const { result } = renderHook(() => useIsAuthenticated());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns isLoading=true when status is loading", () => {
    mockUseSession.mockReturnValue({
      status: "loading",
      data: null,
      update: jest.fn(),
    });

    const { result } = renderHook(() => useIsAuthenticated());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
});
