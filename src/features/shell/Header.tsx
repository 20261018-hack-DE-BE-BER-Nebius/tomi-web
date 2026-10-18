"use client";
import Link from "next/link";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { languages } from "@/lib/i18n";
import type { Language } from "@/lib/types";
import { useApp } from "./AppProvider";
import { InstallButton } from "./InstallButton";
import s from "./Shell.module.css";
export function Preferences() {
  const { language, setLanguage, theme, toggleTheme, t } = useApp();
  return (
    <div className={s.preferences}>
      <InstallButton />
      <select
        aria-label={t.language}
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
      >
        {languages.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </select>
      <button
        type="button"
        title={t.theme}
        aria-label={t.theme}
        onClick={toggleTheme}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </button>
    </div>
  );
}
export function Brand() {
  return (
    <Link href="/" className={s.brand} aria-label="Tomi">
      <span className={s.mark}>
        t<span>·</span>
      </span>
      <span>
        tomi<span className={s.brandDot}>.</span>
      </span>
    </Link>
  );
}
export function Header() {
  const { t } = useApp();
  return (
    <header className={s.header}>
      <Brand />
      <nav className={s.nav}>
        <Link href="/#method">{t.method}</Link>
        <Link href="/deck/202610181800">{t.presentation}</Link>
      </nav>
      <div className={s.actions}>
        <Preferences />
        <Link className={s.signin} href="/login">
          {t.signin}
          <Icon name="arrow" />
        </Link>
      </div>
    </header>
  );
}
