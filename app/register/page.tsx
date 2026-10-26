
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setMessage(
      "Account created! Please check your email to confirm your account before signing in."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
        <Link
          href="/"
          className="text-sm text-[var(--muted)] hover:text-[var(--primary)]"
        >
          ← North Synapse
        </Link>

        <h1 className="mt-8 text-3xl font-semibold">
          Join North Synapse
        </h1>

        <p className="mt-2 text-[var(--muted)]">
          Create an account to join the learning community.
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-[var(--primary)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-[var(--primary)]"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block font-medium">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-[var(--primary)]"
              placeholder="Enter your password again"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-emerald-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
