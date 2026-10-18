"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { useApp } from "@/features/shell/AppProvider";
import { Brand, Preferences } from "@/features/shell/Header";
import { api } from "@/lib/api/client";
import s from "./Login.module.css";
export function Login() {
  const { t } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn(demo: boolean, form?: FormData) {
    setBusy(true);
    setError("");
    try {
      await api(
        demo ? "auth/demo" : "auth/login",
        demo
          ? {}
          : { email: form?.get("email"), password: form?.get("password") },
      );
      router.push("/chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loginError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={s.page}>
      <header>
        <Brand />
        <Preferences />
      </header>
      <section className={s.content}>
        <div className={s.art}>
          <Icon name="spark" />
          <p>{t.tagline}</p>
          <span>BRITANNICA ↔ WIKIPEDIA</span>
        </div>
        <div className={s.card}>
          <Link href="/" className={s.back}>
            ← {t.back}
          </Link>
          <h1>{t.loginTitle}</h1>
          <p>{t.loginCopy}</p>
          <button
            type="button"
            className={s.demo}
            disabled={busy}
            onClick={() => signIn(true)}
          >
            {busy ? t.loading : t.demo}
            <Icon name="arrow" />
          </button>
          <div className={s.divider} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void signIn(false, new FormData(e.currentTarget));
            }}
          >
            <label htmlFor="email">{t.email}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
            />
            <label htmlFor="password">{t.password}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={256}
            />
            <button type="submit" disabled={busy}>
              {t.signin}
              <Icon name="arrow" />
            </button>
          </form>
          {error && (
            <p role="alert" className={s.error}>
              {error}
            </p>
          )}
          <small>{t.localNotice}</small>
        </div>
      </section>
    </main>
  );
}
