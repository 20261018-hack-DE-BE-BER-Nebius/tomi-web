"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { MermaidDiagram } from "@/components/ui/data-display/MermaidDiagram/MermaidDiagram";
import { useApp } from "@/features/shell/AppProvider";
import { Brand, Preferences } from "@/features/shell/Header";
import { architectureByLanguage } from "./architecture";
import s from "./Deck.module.css";
import labels from "./labels.json";
import slides from "./slides.json";

const captures = {
  0: "azure-landing",
  2: "azure-comparison-light",
  3: "azure-comparison-trace",
} as const;
export function Deck() {
  const { language, t } = useApp();
  const l = labels[language];
  const [index, setIndex] = useState(0);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [diagrams, setDiagrams] = useState<Record<string, string>>({});
  const initialDiagram = architectureByLanguage[language];
  const source = sources[language] ?? initialDiagram;
  const diagram = diagrams[language] ?? initialDiagram;
  const setSource = (value: string) =>
    setSources((current) => ({ ...current, [language]: value }));
  const setDiagram = (value: string) =>
    setDiagrams((current) => ({ ...current, [language]: value }));
  const pages = slides[language];
  const page = pages[index];
  const capture = captures[index as keyof typeof captures];
  useEffect(() => {
    function locationIndex() {
      const n = Number(location.hash.replace("#slide-", ""));
      if (Number.isInteger(n) && n >= 1 && n <= pages.length) setIndex(n - 1);
    }
    locationIndex();
    function key(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
            event.target.tagName,
          ))
      )
        return;
      if (event.key === "ArrowRight")
        setIndex((n) => Math.min(n + 1, pages.length - 1));
      if (event.key === "ArrowLeft") setIndex((n) => Math.max(n - 1, 0));
    }
    window.addEventListener("keydown", key);
    window.addEventListener("hashchange", locationIndex);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("hashchange", locationIndex);
    };
  }, [pages.length]);
  useEffect(() => {
    history.replaceState(null, "", `#slide-${index + 1}`);
  }, [index]);
  function download() {
    const url = URL.createObjectURL(new Blob([source], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "tomi-architecture.mmd";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className={s.deck}>
      <header>
        <Brand />
        <span>NEBIUS BUILD WEEK / BERLIN 2026</span>
        <Preferences />
      </header>
      <nav className={s.sections} aria-label={t.presentation}>
        {pages.map((item, n) => (
          <button
            type="button"
            key={item[0]}
            aria-current={index === n ? "step" : undefined}
            onClick={() => setIndex(n)}
          >
            {String(n + 1).padStart(2, "0")} <span>{item[0]}</span>
          </button>
        ))}
      </nav>
      <article className={`${s.slide} ${index === 4 ? s.architecture : ""}`}>
        <div className={s.copy}>
          <span className={s.chapter}>{page[0]}</span>
          <h1>{page[1]}</h1>
          <p>{page[2]}</p>
          {index !== 1 && <small>{page[3]}</small>}
          {index === 6 && (
            <div className={s.links}>
              <Link className={s.cta} href="/chat">
                {l.workspace}
                <Icon name="arrow" />
              </Link>
              <Link className={s.secondary} href="/canvas">
                {l.canvas}
                <Icon name="grid" />
              </Link>
              <a className={s.secondary} href="/archive/">
                {t.archive}
                <Icon name="book" />
              </a>
            </div>
          )}
        </div>
        {capture && (
          <figure className={s.capture}>
            <Image
              src={`/deck/${capture}.webp`}
              width={890}
              height={929}
              alt={index === 0 ? page[2] : page[3]}
              priority={index === 0}
            />
            <figcaption>{l.capture} / 18.10.2026</figcaption>
          </figure>
        )}
        {index === 1 && (
          <ol className={s.principles}>
            {page[3].split("|").map((text, n) => (
              <li key={text}>
                <span>0{n + 1}</span>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        )}
        {index === 4 && (
          <div className={s.diagramArea}>
            <MermaidDiagram
              source={diagram}
              label={l.diagramAlt}
              loading={l.loading}
              invalid={l.invalid}
            />
            <details className={s.editor}>
              <summary>{l.edit}</summary>
              <label htmlFor="mermaid-source">{l.source}</label>
              <textarea
                id="mermaid-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                maxLength={12000}
                spellCheck={false}
              />
              <div>
                <button type="button" onClick={() => setDiagram(source)}>
                  {l.render}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSource(initialDiagram);
                    setDiagram(initialDiagram);
                  }}
                >
                  {l.reset}
                </button>
                <button type="button" onClick={download}>
                  {l.download}
                </button>
              </div>
            </details>
          </div>
        )}
        {index === 5 && (
          <dl className={s.readiness}>
            {[
              ["Parse3.5", l.parseRole, true],
              ["Nemotron 3 Embed VL", l.embedRole, false],
              ["Nemotron 3 Rerank VL", l.rerankRole, false],
              ["Nemotron 3.5 Super VL", l.superRole, true],
            ].map(([name, role, verified]) => (
              <div key={String(name)}>
                <dt>
                  {name}
                  <small>{role}</small>
                </dt>
                <dd data-verified={Boolean(verified)}>
                  {name === "Nemotron 3.5 Super VL"
                    ? l.providerVerified
                    : verified
                      ? l.verified
                      : l.pending}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {index === 6 && (
          <section className={s.walkthrough}>
            <h2>{l.walkthrough}</h2>
            <ol>
              {[
                ["00:00", l.step1],
                ["01:00", l.step2],
                ["02:15", l.step3],
                ["03:30", l.step4],
              ].map(([time, label]) => (
                <li key={time}>
                  <span>{time}</span>
                  {label}
                </li>
              ))}
            </ol>
          </section>
        )}
      </article>
      <footer>
        <span>TOMI / TIMELENS</span>
        <div className={s.controls}>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            aria-label={t.prev}
          >
            ←
          </button>
          <span>
            {index + 1} / {pages.length}
          </span>
          <button
            type="button"
            disabled={index === pages.length - 1}
            onClick={() => setIndex(index + 1)}
            aria-label={t.next}
          >
            →
          </button>
        </div>
      </footer>
    </main>
  );
}
