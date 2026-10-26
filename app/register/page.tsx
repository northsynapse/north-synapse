
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
  const [readNotice, setReadNotice] = useState(false);
  const [acceptPromise, setAcceptPromise] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!readNotice || !acceptPromise) {
      setError("Please read the User Notice and accept the Student Pledge.");
      return;
    }

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
        data: {
          accepted_user_notice: true,
          accepted_student_pledge: true,
          accepted_at: new Date().toISOString(),
        },
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
      "Registration submitted. Please check your email to confirm your account before signing in."
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
          Create an account for your learning community.
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
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3"
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
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3"
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
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3"
              placeholder="Enter your password again"
            />
          </div>

          <div className="space-y-4 rounded-xl border border-[var(--border)] p-4">
            <div>
              <h2 className="font-semibold">User Notice</h2>
              <div className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-[var(--surface-secondary)] p-3 text-sm text-[var(--muted)]">
                <p>
                  North Synapse is a learning community. Use respectful
                  language, share only content you have permission to share,
                  protect personal information, and do not post harassment,
                  spam, or misleading content.
                </p>
                <p className="mt-2">
                  Keep your account secure and report inappropriate content
                  to the site administrators. Access may be restricted if
                  community rules are violated.
                </p>
              </div>
              <label className="mt-3 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={readNotice}
                  onChange={(event) => setReadNotice(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I have read and understood the User Notice.
                </span>
              </label>
            </div>

            <div>
              <h2 className="font-semibold">Student Pledge</h2>
              <div className="mt-2 rounded-lg bg-[var(--surface-secondary)] p-3 text-sm text-[var(--muted)]">
                I will contribute honestly, respect other students, protect
                the privacy of community members, and use this platform
                for constructive learning and collaboration.
              </div>
              <label className="mt-3 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={acceptPromise}
                  onChange={(event) => setAcceptPromise(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I agree to follow the Student Pledge.
                </span>
              </label>
            </div>
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
            className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 font-medium text-white disabled:opacity-60"
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
