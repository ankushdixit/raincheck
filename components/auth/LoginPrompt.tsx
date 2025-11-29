"use client";

/**
 * Login Prompt Component
 *
 * Displays a message prompting unauthenticated users to log in.
 * Used as a fallback when hiding protected actions from guests.
 */

import Link from "next/link";

export interface LoginPromptProps {
  /** Custom message to display (defaults to "Log in to schedule runs") */
  message?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A prompt that guides unauthenticated users to log in
 *
 * @example
 * <LoginPrompt />
 *
 * @example
 * <LoginPrompt message="Log in to accept suggestions" />
 */
export function LoginPrompt({
  message = "Log in to schedule runs",
  className = "",
}: LoginPromptProps) {
  return (
    <Link
      href="/login"
      className={`text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors ${className}`.trim()}
    >
      {message}
    </Link>
  );
}
