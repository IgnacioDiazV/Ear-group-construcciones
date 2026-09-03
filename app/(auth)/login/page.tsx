"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./login.module.css";

function getSafeNextPath() {
  const nextPath = new URLSearchParams(window.location.search).get("next");
  return nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/erp/obras";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage("El email o la contraseña no son correctos.");
      setIsLoading(false);
      return;
    }

    router.replace(getSafeNextPath());
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <section className={styles.loginPanel} aria-labelledby="login-title">
        <div className={styles.brand}>
          <span className={styles.logo}>EAR</span>
          <span className={styles.brandName}>EAR GROUP</span>
        </div>

        <div className={styles.heading}>
          <p className={styles.eyebrow}>Portal interno</p>
          <h1 id="login-title">Ingresar al sistema</h1>
          <p>Accedé a la gestión de obras y operaciones de EAR Group.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {errorMessage && (
            <div className={styles.alert} role="alert">
              {errorMessage}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              autoComplete="email"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              autoComplete="current-password"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <button className={styles.submitButton} disabled={isLoading} type="submit">
            {isLoading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className={styles.footerNote}>Acceso exclusivo para personal autorizado.</p>
      </section>
    </main>
  );
}