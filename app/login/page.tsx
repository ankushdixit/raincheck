"use client";

/**
 * Login Page
 *
 * Simple password authentication page for Ankush's Training Tracker.
 * Redirects authenticated users to homepage.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoginForm } from "@/components/auth";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  // Redirect authenticated users to homepage
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Show nothing while checking auth status
  if (status === "loading") {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center">
        <div className="absolute top-0 left-0 w-full h-full z-0 bg-forest-deep" />
      </main>
    );
  }

  // Don't render login form if authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center">
      {/* Background */}
      <div
        className="absolute top-0 left-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(10, 15, 10, 0.7), rgba(10, 15, 10, 0.7)), url('/images/trails/default-trail.webp')`,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
        {/* Card matching homepage style */}
        <div className="w-full max-w-sm rounded-xl bg-forest-dark p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Ankush&apos;s Training Tracker
            </h1>
            <p className="text-text-primary/60">Sign in to manage your runs</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
