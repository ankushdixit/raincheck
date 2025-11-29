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
        className="box-border w-full text-text-primary placeholder-text-primary/40 disabled:opacity-50 transition-all"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          padding: "14px 16px",
          borderRadius: "8px",
          border: "2px solid transparent",
          outline: "none",
          caretColor: "white",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "transparent")}
        placeholder="Enter password"
      />

      {error && (
        <div
          role="alert"
          className="text-sm text-red-200"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            padding: "14px 16px",
            borderRadius: "8px",
            marginTop: "16px",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="box-border w-full font-semibold text-white transition-all hover:opacity-90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{
          backgroundColor: "rgba(5, 150, 105, 0.8)",
          padding: "14px 16px",
          borderRadius: "8px",
          border: "none",
          marginTop: "16px",
        }}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>

      <div className="text-center" style={{ marginTop: "16px" }}>
        <Link
          href="/"
          style={{
            color: "rgba(245, 245, 245, 0.6)",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          Back to home
        </Link>
      </div>
    </form>
  );
}
