import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth";

/**
 * Login Page
 *
 * Simple password authentication page for Ankush's Training Tracker.
 * Redirects authenticated users to homepage.
 */
export default async function LoginPage() {
  // Check if user is already authenticated
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-forest-deep px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Ankush&apos;s Training Tracker
          </h1>
          <p className="text-text-primary/60">Sign in to manage your runs</p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
