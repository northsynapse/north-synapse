"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F7FA] px-5 py-12 text-[#20212A]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-[#7B52E5]/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -left-28 h-96 w-96 rounded-full border border-[#7B52E5]/10" />

      <div className="relative w-full max-w-[460px]">
        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#7B52E5] text-white shadow-sm">
            <KeyRound size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[19px] font-bold tracking-[-0.04em]">North Synapse</span>
        </div>

        <section className="overflow-hidden rounded-[22px] border border-[#E6E3ED] bg-white shadow-[0_18px_55px_rgba(39,28,72,0.08)]">
          <div className="h-[4px] w-full bg-[#7B52E5]" />
          <div className="px-7 py-9 sm:px-10 sm:py-10">
            <Link href="/login" className="inline-flex items-center gap-2 text-[13px] font-medium text-[#777483] transition-colors hover:text-[#7B52E5]">
              <ArrowLeft size={15} /> Back to sign in
            </Link>

            <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E9E2FA] bg-[#F5F1FE] text-[#7B52E5]">
              <Mail size={25} strokeWidth={1.8} />
            </div>

            <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7B52E5]">Account recovery</p>
            <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-[-0.045em] text-[#20212A]">Forgot your password?</h1>
            <p className="mt-3 text-[14px] leading-6 text-[#777483]">
              It happens. Enter the email address linked to your North Synapse account and we’ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-[13px] font-semibold text-[#34313E]">Email address</label>
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
                  className="h-[50px] w-full rounded-xl border border-[#DEDCE5] bg-[#FCFBFD] px-4 text-[14px] text-[#252330] outline-none transition placeholder:text-[#AAA7B3] focus:border-[#7B52E5] focus:bg-white focus:ring-4 focus:ring-[#7B52E5]/10"
                  placeholder="you@example.com"
                />
              </div>

              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-700">{error}</p>}
              {message && (
                <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] leading-5 text-emerald-800">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="flex h-[50px] w-full items-center justify-center rounded-xl bg-[#7B52E5] px-4 text-[14px] font-semibold text-white shadow-[0_5px_14px_rgba(123,82,229,0.2)] transition hover:bg-[#6942D0] hover:shadow-[0_7px_18px_rgba(123,82,229,0.25)] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Sending reset link…" : "Send reset link"}
              </button>
            </form>

            <div className="mt-7 border-t border-[#EEEAF3] pt-5 text-center">
              <p className="text-[12px] leading-5 text-[#92909B]">Remembered your password?{" "}
                <Link href="/login" className="font-semibold text-[#7B52E5] hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-[11px] tracking-wide text-[#A09DA9]">A learning community built for curious minds.</p>
      </div>
    </main>
  );
}
