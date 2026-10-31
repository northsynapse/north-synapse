"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import styles from "./page.module.css";

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
    <main className={styles.page}>
      <div aria-hidden="true" className={styles.orbitOne} />
      <div aria-hidden="true" className={styles.orbitTwo} />

      <div className={styles.wrapper}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}><KeyRound size={19} strokeWidth={2.2} /></span>
          <span className={styles.brandName}>North Synapse</span>
        </div>

        <section className={styles.card}>
          <div className={styles.accentLine} />
          <div className={styles.cardBody}>
            <Link href="/login" className={styles.backLink}>
              <ArrowLeft size={15} /> Back to sign in
            </Link>

            <div className={styles.mailIcon}><Mail size={25} strokeWidth={1.8} /></div>
            <p className={styles.eyebrow}>Account recovery</p>
            <h1 className={styles.heading}>Forgot your password?</h1>
            <p className={styles.description}>
              It happens. Enter the email address linked to your North Synapse account and we’ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div>
                <label htmlFor="email" className={styles.label}>Email address</label>
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
                  className={styles.input}
                  placeholder="you@example.com"
                />
              </div>

              {error && <p role="alert" className={styles.error}>{error}</p>}
              {message && (
                <div role="status" className={styles.success}>
                  <CheckCircle2 size={18} />
                  <span>{message}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className={styles.submit}>
                {loading ? "Sending reset link…" : "Send reset link"}
              </button>
            </form>

            <div className={styles.footer}>
              Remembered your password?{" "}
              <Link href="/login" className={styles.footerLink}>Sign in</Link>
            </div>
          </div>
        </section>

        <p className={styles.tagline}>A learning community built for curious minds.</p>
      </div>
    </main>
  );
}
