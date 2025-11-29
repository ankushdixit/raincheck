"use client";

/**
 * Hook for checking authentication state
 *
 * Provides a simple interface to check if the current user is authenticated.
 * Uses NextAuth's useSession hook under the hood.
 */

import { useSession } from "next-auth/react";

export interface UseIsAuthenticatedResult {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the session is still loading */
  isLoading: boolean;
}

/**
 * Check if the current user is authenticated
 *
 * @returns Object with isAuthenticated and isLoading states
 *
 * @example
 * const { isAuthenticated, isLoading } = useIsAuthenticated();
 *
 * if (isLoading) return <Spinner />;
 * if (isAuthenticated) return <ProtectedContent />;
 * return <LoginPrompt />;
 */
export function useIsAuthenticated(): UseIsAuthenticatedResult {
  const { status } = useSession();

  return {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}
