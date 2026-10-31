"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage("If an account exists for this email, a password reset link will be sent shortly. Please also check your spam folder.");
    } catch (requestError) {
      console.error("Password reset request failed:", requestError);
      setError("Unable to send a reset link right now. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
        <Link href="/login" className="text-sm text-[var(--muted)] hover:text-[var(--primary)]">← Back to sign in</Link>
        <h1 className="mt-8 text-3xl font-semibold">Reset your password</h1>
        <p className="mt-2 text-[var(--muted)]">Enter the email address associated with your North Synapse account.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block font-medium">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
              spellCheck={false}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-[var(--primary)]"
              placeholder="you@example.com"
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </div>
    </main>
  );
}
