/**
 * NextAuth API Route Handler
 *
 * This file exports the NextAuth handlers for the authentication API routes.
 * All auth-related endpoints (signin, signout, session, csrf) are handled here.
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
