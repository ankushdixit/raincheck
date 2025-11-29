"use client";

/**
 * Login Form Component
 *
 * A simple password-only login form for single-user authentication.
 * Uses NextAuth's signIn function with credentials provider.
 */

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface LoginFormProps {
  /** URL to redirect to after successful login */
  callbackUrl?: string;
}

/**
 * Password-only login form for Ankush's Training Tracker
 *
 * @example
 * <LoginForm callbackUrl="/" />
 */
export function LoginForm({ callbackUrl = "/" }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials");
        setIsLoading(false);
        return;
      }

      // Successful login - redirect to callback URL
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-text-primary/80">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-text-primary placeholder-text-primary/50 backdrop-blur-sm focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
          placeholder="Enter password"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-white/20 px-4 py-3 font-medium text-text-primary backdrop-blur-sm transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>

      <div className="text-center">
        <Link
          href="/"
          className="text-sm text-text-primary/60 hover:text-text-primary/80 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </form>
  );
}
