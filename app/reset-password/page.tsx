"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import styles from "./page.module.css";

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

            <div className={styles.icon}><ShieldCheck size={25} strokeWidth={1.8} /></div>
            <p className={styles.eyebrow}>Account security</p>
            <h1 className={styles.heading}>Create a new password</h1>
            <p className={styles.description}>
              Choose a new password for your North Synapse account. Use at least 8 characters.
            </p>

            {ready ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div>
                  <label htmlFor="password" className={styles.label}>New password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={styles.input}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className={styles.label}>Confirm new password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={styles.input}
                    placeholder="Enter it again"
                  />
                </div>
                {error && <p role="alert" className={styles.error}>{error}</p>}
                {message && <p role="status" className={styles.success}>{message}</p>}
                <button type="submit" disabled={loading} className={styles.submit}>
                  {loading ? "Updating password…" : "Update password"}
                </button>
              </form>
            ) : (
              <div className={styles.notice}>
                {error && <p role="alert" className={styles.error}>{error}</p>}
                <Link href="/forgot-password" className={styles.footerLink}>Request a new reset link</Link>
              </div>
            )}

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
