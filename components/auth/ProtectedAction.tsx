"use client";

/**
 * Protected Action Component
 *
 * Conditionally renders children based on authentication state.
 * Shows a fallback (typically a LoginPrompt) when user is not authenticated.
 * Handles loading states with optional skeleton/loader display.
 */

import type { ReactNode } from "react";
import { useIsAuthenticated } from "@/hooks";
import { LoginPrompt } from "./LoginPrompt";

export interface ProtectedActionProps {
  /** Content to render when user is authenticated */
  children: ReactNode;
  /** Content to render when user is not authenticated (defaults to LoginPrompt) */
  fallback?: ReactNode;
  /** Content to render while auth state is loading */
  loadingFallback?: ReactNode;
  /** Whether to hide the fallback entirely (show nothing for unauthenticated) */
  hideWhenUnauthenticated?: boolean;
}

/**
 * Wrapper that conditionally renders content based on auth state
 *
 * @example
 * // Show Accept button only when authenticated, LoginPrompt otherwise
 * <ProtectedAction>
 *   <Button onClick={handleAccept}>Accept</Button>
 * </ProtectedAction>
 *
 * @example
 * // Custom fallback message
 * <ProtectedAction fallback={<LoginPrompt message="Log in to accept" />}>
 *   <Button onClick={handleAccept}>Accept</Button>
 * </ProtectedAction>
 *
 * @example
 * // Hide completely when unauthenticated
 * <ProtectedAction hideWhenUnauthenticated>
 *   <Button onClick={handleDelete}>Delete</Button>
 * </ProtectedAction>
 */
export function ProtectedAction({
  children,
  fallback,
  loadingFallback = null,
  hideWhenUnauthenticated = false,
}: ProtectedActionProps) {
  const { isAuthenticated, isLoading } = useIsAuthenticated();

  // Show loading fallback while session is being determined
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  // User is authenticated - render children
  if (isAuthenticated) {
    return <div className="transition-opacity duration-200 ease-in-out">{children}</div>;
  }

  // User is not authenticated
  if (hideWhenUnauthenticated) {
    return null;
  }

  // Show fallback or default LoginPrompt
  return (
    <div className="transition-opacity duration-200 ease-in-out">{fallback ?? <LoginPrompt />}</div>
  );
}
