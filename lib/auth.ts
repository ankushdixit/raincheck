/**
 * NextAuth.js Configuration
 *
 * This file configures authentication using NextAuth.js v5 (Auth.js)
 * with a simple credentials provider for single-user authentication.
 *
 * The owner (Ankush) authenticates with a password stored in environment
 * variables. All data remains publicly viewable, but mutations require auth.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * NextAuth configuration with Credentials provider
 *
 * Uses JWT strategy for stateless session management.
 * Password is validated against AUTH_PASSWORD environment variable.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate password against environment variable
        const password = credentials?.password;
        const authPassword = process.env.AUTH_PASSWORD;

        if (!authPassword) {
          console.error("AUTH_PASSWORD environment variable is not set");
          return null;
        }

        if (typeof password !== "string" || password !== authPassword) {
          return null;
        }

        // Return user object for session
        // Single user app - hardcoded user details
        return {
          id: "owner",
          name: "Ankush",
          email: "ankush@raincheck.app",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
