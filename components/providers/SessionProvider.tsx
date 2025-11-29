"use client";

/**
 * Session Provider Component
 *
 * Wraps children with NextAuth's SessionProvider for client-side session access.
 * This is a client component that enables useSession hook throughout the app.
 */

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
