"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { ComparisonCard } from "@/components/ui/cards/ComparisonCard/ComparisonCard";
import { EvidenceGraph } from "@/components/ui/data-display/EvidenceGraph/EvidenceGraph";
import { TracePanel } from "@/components/ui/data-display/TracePanel/TracePanel";
import { useApp } from "@/features/shell/AppProvider";
import { Brand, Preferences } from "@/features/shell/Header";
import { api } from "@/lib/api/client";
import { safeSourceUrl } from "@/lib/types";
import {
  CONVERSATION_CHANGED,
  readConversation,
  restoreConversation,
} from "./conversation";
import s from "./EvidenceLab.module.css";
import labels from "./labels.json";
import { parseReplay, type Replay } from "./replay";
export function EvidenceLab({
  mode: initial,
  live = true,
}: {
  mode: "cards" | "canvas" | "graph";
  live?: boolean;
}) {
  const { language, t } = useApp();
  const l = labels[language];
  const [mode, setMode] = useState(initial);
  const [runs, setRuns] = useState<Replay[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(live);
  const [imported, setImported] = useState(false);
  const owner = useRef("");
  const manual = useRef(false);
  const refresh = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    manual.current = false;
    setImported(false);
    try {
      const identity = await api<{ user: { id: string } }>("auth/me");
      owner.current = identity.user.id;
      const saved = readConversation(owner.current);
      setRuns(
        parseReplay({
          format: "tomi-evidence-conversation-v1",
          turns: saved?.turns || [],
        }) || [],
      );
      const restored = await restoreConversation(owner.current);
      if (!manual.current)
        setRuns(
          parseReplay({
            format: "tomi-evidence-conversation-v1",
            turns: restored?.turns || [],
          }) || [],
        );
    } catch {
      if (!manual.current) setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [live]);
  useEffect(() => {
    void refresh();
    function changed() {
      if (manual.current || !owner.current) return;
      const saved = readConversation(owner.current);
      setRuns(
        parseReplay({
          format: "tomi-evidence-conversation-v1",
          turns: saved?.turns || [],
        }) || [],
      );
    }
    window.addEventListener(CONVERSATION_CHANGED, changed);
    window.addEventListener("storage", changed);
    window.addEventListener("focus", changed);
    return () => {
      window.removeEventListener(CONVERSATION_CHANGED, changed);
      window.removeEventListener("storage", changed);
      window.removeEventListener("focus", changed);
    };
  }, [refresh]);
  async function load(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > 10_000_000) {
      setError(l.fileTooLarge);
      return;
    }
    try {
      const parsed = parseReplay(JSON.parse(await file.text()));
      if (!parsed) throw new Error(l.invalidFile);
      manual.current = true;
      setImported(true);
      setRuns(parsed);
    } catch {
      setError(l.invalidFile);
    }
  }
  const sources = [
    ...new Map(
      runs
        .flatMap((run) => run.answer.evidence)
        .map((source) => [`${source.id}-${source.url}`, source]),
    ).values(),
  ].filter((source) =>
    `${source.title} ${source.excerpt}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  return (
    <div className={s.page}>
      <header>
        <Brand />
        <span>TIME LENS / {l[mode]}</span>
        <Preferences />
      </header>
      <main>
        <div className={s.heading}>
          <div>
            <span className={s.kicker}>{t.sources}</span>
            <h1>{l[mode]}</h1>
            <p>{live ? l.liveHint : l.importHint}</p>
          </div>
          <div className={s.actions}>
            {live && (
              <Link className={s.workspaceLink} href="/chat">
                {l.openWorkspace}
                <Icon name="arrow" />
              </Link>
            )}
            <label className={s.upload}>
              <Icon name="plus" />
              {l.importEvidence}
              <input
                type="file"
                accept="application/json,.json"
                onChange={(e) => load(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
        <div className={s.toolbar}>
          <nav>
            {(["cards", "canvas", "graph"] as const).map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setMode(tab)}
                aria-pressed={mode === tab}
              >
                {l[tab]}
              </button>
            ))}
          </nav>
          <div className={s.sync}>
            {live && (
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
              >
                {loading ? t.loading : l.refresh}
              </button>
            )}
            <span>{imported ? l.imported : live ? l.current : l.raw}</span>
            <span>
              {runs.length} {l.runsCount} · {sources.length} {l.sourcesCount}
            </span>
          </div>
        </div>
        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}
        {!runs.length ? (
          <div className={s.empty}>
            <Icon name="book" />
            <h2>{loading ? t.loading : live ? l.emptyLive : l.noGraph}</h2>
            <p>{live ? l.emptyHint : t.noSources}</p>
            {live && (
              <Link className={s.workspaceLink} href="/chat">
                {l.openWorkspace}
                <Icon name="arrow" />
              </Link>
            )}
          </div>
        ) : mode === "cards" ? (
          <div className={s.cards}>
            {runs.map((run) => (
              <section key={run.id}>
                <h2>{run.question}</h2>
                <ComparisonCard answer={run.answer} labels={t} />
                <TracePanel
                  events={run.events}
                  label={t.traces}
                  note={t.traceNote}
                />
              </section>
            ))}
          </div>
        ) : (
          <>
            <div className={s.context}>
              <span>{l.context}</span>
              <h2>{runs.at(-1)?.question}</h2>
              <p>{l.boardHint}</p>
            </div>
            <label className={s.filter}>
              {l.filter}
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </label>
            {!sources.length && <output>{l.noMatches}</output>}
            {mode === "graph" ? (
              <EvidenceGraph
                evidence={sources}
                label={l.graph}
                hint={l.graphHint}
                unavailable={l.webglUnavailable}
              />
            ) : (
              <div className={s.canvas}>
                {sources.map((source) => (
                  <article
                    key={`${source.id}-${source.url}`}
                    data-source={source.source}
                  >
                    <span>
                      {source.source === "historical"
                        ? t.historical
                        : t.modernSource}
                    </span>
                    <h2>{source.title}</h2>
                    <p>
                      {source.excerpt.length > 400
                        ? `${source.excerpt.slice(0, 400).trimEnd()}…`
                        : source.excerpt}
                    </p>
                    {source.excerpt.length > 400 && (
                      <details>
                        <summary>{t.fullPassage}</summary>
                        <p>{source.excerpt}</p>
                      </details>
                    )}
                    {safeSourceUrl(source.url) && (
                      <a
                        href={safeSourceUrl(source.url)}
                        target="_blank"
                        rel="noopener noreferrer nofollow ugc"
                      >
                        {t.sourceLink}
                        <Icon name="external" />
                      </a>
                    )}
                    <small>{source.id}</small>
                  </article>
                ))}
              </div>
            )}
            <div className={s.tableWrap}>
              <table>
                <caption>{t.sources}</caption>
                <thead>
                  <tr>
                    <th>{l.sourceId}</th>
                    <th>{l.sourceType}</th>
                    <th>{l.titleLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={`${source.id}-${source.url}`}>
                      <td>{source.id}</td>
                      <td>
                        {source.source === "historical"
                          ? l.historicalCategory
                          : l.modernCategory}
                      </td>
                      <td>
                        {safeSourceUrl(source.url) ? (
                          <a
                            href={safeSourceUrl(source.url)}
                            target="_blank"
                            rel="noopener noreferrer nofollow ugc"
                          >
                            {source.title}
                          </a>
                        ) : (
                          source.title
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
