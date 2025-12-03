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
import { cn } from "@/lib/utils";

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
    <form onSubmit={handleSubmit} className="w-full">
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        aria-label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        className={cn(
          "box-border w-full text-text-primary placeholder:text-text-primary/40",
          "disabled:opacity-50 transition-all",
          "bg-white/[0.08] py-3.5 px-4 rounded-lg",
          "border-2 border-transparent outline-none caret-white",
          "focus:border-white/40"
        )}
        placeholder="Enter password"
      />

      {error && (
        <div role="alert" className="text-sm text-red-200 bg-error/15 py-3.5 px-4 rounded-lg mt-4">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "box-border w-full font-semibold text-white transition-all",
          "hover:opacity-90 focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          "bg-emerald-600/80 py-3.5 px-4 rounded-lg border-none mt-4"
        )}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>

      <div className="text-center mt-4">
        <Link
          href="/"
          className="text-text-primary/60 text-sm no-underline hover:text-text-primary transition-colors"
        >
          Back to home
        </Link>
      </div>
    </form>
  );
}
