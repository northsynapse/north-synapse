"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const checkRecoverySession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError || !data.session) {
        setError("This reset link is invalid or has expired. Please request a new one.");
        setReady(false);
        return;
      }
      setReady(true);
    };

    void checkRecoverySession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setError("");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("We couldn't update your password. The reset link may have expired; please request a new one.");
      return;
    }

    setMessage("Your password has been updated. You can now sign in with your new password.");
    await supabase.auth.signOut();
    window.setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
        <Link href="/login" className="text-sm text-[var(--muted)] hover:text-[var(--primary)]">← Back to sign in</Link>
        <h1 className="mt-8 text-3xl font-semibold">Create a new password</h1>
        <p className="mt-2 text-[var(--muted)]">Choose a new password for your North Synapse account.</p>
        {ready ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="password" className="mb-2 block font-medium">New password</label>
              <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-[var(--primary)]" placeholder="At least 8 characters" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block font-medium">Confirm new password</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-[var(--primary)]" placeholder="Enter it again" />
            </div>
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            {message && <p role="status" className="text-sm text-green-600">{message}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <Link href="/forgot-password" className="inline-block font-medium text-[var(--primary)] hover:underline">Request a new reset link</Link>
          </div>
        )}
      </div>
    </main>
  );
}
