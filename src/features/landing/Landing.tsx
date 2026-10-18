"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { useApp } from "@/features/shell/AppProvider";
import { Header } from "@/features/shell/Header";
import { api } from "@/lib/api/client";
import s from "./Landing.module.css";
export function Landing() {
  const { t } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function demo() {
    setBusy(true);
    setError("");
    try {
      await api("auth/demo", {});
      router.push("/chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loginError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className={s.main}>
        <section className={s.hero}>
          <div className={s.intro}>
            <div className={s.eyebrow}>
              <span />
              TOMI TIMELENS <span className={s.separator}>/</span> BERLIN 2026
            </div>
            <h1>
              {t.hero1}
              <br />
              <em>{t.hero2}</em>
            </h1>
            <p className={s.description}>{t.intro}</p>
            <div className={s.ctas}>
              <button
                type="button"
                onClick={demo}
                disabled={busy}
                className={s.primary}
              >
                {busy ? t.loading : t.demo}
                <Icon name="arrow" />
              </button>
              <Link href="/deck/202610181800">
                {t.deck}
                <Icon name="external" />
              </Link>
            </div>
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
            <div className={s.powered}>
              <span className={s.nvidia}>NVIDIA</span>
              <span>Nemotron</span>
              <span className={s.dot} />
              <span>Nebius</span>
              <span className={s.dot} />
              <span>Hermes</span>
            </div>
          </div>
          <div className={s.visual} role="img" aria-label={t.comparison}>
            <div className={s.orbit} />
            <article className={s.oldPage}>
              <div className={s.pageMeta}>ENCYCLOPÆDIA</div>
              <h2>BRITANNICA.</h2>
              <div className={s.rule} />
              <div className={s.archiveNumber}>I.</div>
              <div className={s.printTitle}>
                KNOWLEDGE
                <br />
                ACROSS TIME
              </div>
              <div className={s.columns} aria-hidden="true">
                {"abcdefghijklmnopqrst".split("").map((letter) => (
                  <span key={letter} />
                ))}
              </div>
              <div className={s.pageFoot}>
                {t.archive}
                <Icon name="book" />
              </div>
            </article>
            <div className={s.connector}>
              <Icon name="spark" />
            </div>
            <article className={s.newPage}>
              <div className={s.newTop}>
                <span className={s.newW}>W</span>
                <span>
                  WIKIPEDIA
                  <br />
                  <small>{t.modern}</small>
                </span>
                <Icon name="external" />
              </div>
              <div className={s.modernTitle}>{t.tagline}</div>
              <div className={s.topicPills}>
                <span>language</span>
                <span>knowledge</span>
                <span>perspective</span>
              </div>
              <div className={s.flowLines} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={s.evidenceLink}>
                <Icon name="book" />
                <span>{t.sources}</span>
                <Icon name="arrow" />
              </div>
            </article>
            <div className={s.visualCaption}>
              <span className={s.captionMark}>↔</span>
              {t.comparison}
            </div>
          </div>
        </section>
        <section className={s.method} id="method">
          <div className={s.sectionLabel}>
            01 <span>{t.method}</span>
          </div>
          <div className={s.steps}>
            {[1, 2, 3].map((n) => (
              <article key={n}>
                <div className={s.stepNumber}>
                  0{n}
                  <Icon
                    name={n === 1 ? "book" : n === 2 ? "activity" : "spark"}
                  />
                </div>
                <h3>{t[`step${n}` as keyof typeof t]}</h3>
                <p>{t[`step${n}body` as keyof typeof t]}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={s.bottom}>
          <span>{t.powered}</span>
          <Link href="/login">
            {t.explore}
            <Icon name="arrow" />
          </Link>
        </section>
      </main>
      <footer className={s.footer}>
        <span>tomi.</span>
        <span>{t.footer}</span>
        <span>EN · ES · DE · FR</span>
      </footer>
    </>
  );
}
