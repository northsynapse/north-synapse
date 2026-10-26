
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
  const [isStudent, setIsStudent] = useState(false);
  const [acceptedNotice, setAcceptedNotice] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!isStudent || !acceptedNotice) {
      setError("Please complete both required confirmations.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
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

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              is_student: true,
              accepted_user_notice: true,
              accepted_at: new Date().toISOString(),
            },
          },
        });

      if (signUpError) {
        const errorText = signUpError.message.toLowerCase();

        if (
          errorText.includes("already registered") ||
          errorText.includes("already exists") ||
          errorText.includes("user already")
        ) {
          setError(
            "An account may already exist for this email. Please sign in or reset your password instead."
          );
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
        return;
      }

      setMessage(
        "If this email can be registered, you will receive an email with the next steps. If you already have an account, please sign in or reset your password."
      );
    } catch {
      setError(
        "Something went wrong. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
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
          Create your learning community account.
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
            <label
              htmlFor="confirmPassword"
              className="mb-2 block font-medium"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3"
              placeholder="Enter your password again"
            />
          </div>

          <div className="space-y-4 border-t border-[var(--border)] pt-5">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(event) => setIsStudent(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--primary)]"
              />
              <span>I confirm that I am a student.</span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={acceptedNotice}
                onChange={(event) =>
                  setAcceptedNotice(event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-[var(--primary)]"
              />
              <span>
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowNotice(true)}
                  className="font-medium text-[var(--primary)] underline underline-offset-2"
                >
                  User Notice
                </button>
                .
              </span>
            </label>
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

        <p className="mt-3 text-center text-sm text-[var(--muted)]">
          Forgot your password?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-[var(--primary)] hover:underline"
          >
            Reset it
          </Link>
        </p>
      </div>

      {showNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowNotice(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-title"
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="notice-title" className="text-xl font-semibold">
                North Synapse — User Notice
              </h2>
              <button
                type="button"
                aria-label="Close User Notice"
                onClick={() => setShowNotice(false)}
                className="rounded-lg px-3 py-1 text-lg text-[var(--muted)] hover:bg-[var(--surface-secondary)]"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--muted)]">
              <section>
                <h3 className="font-semibold text-[var(--foreground)]">
                  1. Purpose of the Platform
                </h3>
                <p>
                  North Synapse is a student learning community designed
                  to support academic discussion, resource sharing, and
                  collaborative learning.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--foreground)]">
                  2. Respectful Participation
                </h3>
                <p>
                  Treat other members respectfully. Harassment,
                  discrimination, bullying, threats, and deliberately
                  disruptive behaviour are not permitted.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--foreground)]">
                  3. Honest Use
                </h3>
                <p>
                  Share accurate information to the best of your
                  knowledge. Do not impersonate others, spam the
                  community, or misrepresent another person&apos;s work
                  as your own.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--foreground)]">
                  4. Content and Copyright
                </h3>
                <p>
                  Only upload or share material you have the right to
                  distribute. Respect the intellectual property and
                  privacy of others.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--foreground)]">
                  5. Privacy and Account Security
                </h3>
                <p>
                  Do not share passwords or publish other people&apos;s
                  private information without permission. Keep your
                  account credentials secure.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--foreground)]">
                  6. Reporting and Moderation
                </h3>
                <p>
                  Report inappropriate content or misuse to the
                  platform administrators. Content that violates
                  community rules may be removed, and access may be
                  restricted when appropriate.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--foreground)]">
                  7. Responsible Use
                </h3>
                <p>
                  Use North Synapse for constructive learning and
                  collaboration. Do not use the platform for unlawful
                  activities or to compromise the security of the
                  website or other users.
                </p>
              </section>

              <p className="text-xs">
                This is an initial community notice and should be
                reviewed and updated before the platform opens to the
                public.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNotice(false)}
              className="mt-6 w-full rounded-xl bg-[var(--primary)] px-4 py-3 font-medium text-white"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
