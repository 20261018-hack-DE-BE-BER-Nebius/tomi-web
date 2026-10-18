import { EvidenceGraph } from "@/components/ui/data-display/EvidenceGraph/EvidenceGraph";
import labels from "@/features/evidence/labels.json";
import { useApp } from "@/features/shell/AppProvider";
import { type Evidence, safeSourceUrl } from "@/lib/types";
import s from "./Chat.module.css";
export function LiveGraph({ evidence }: { evidence: Evidence[] }) {
  const { language, t } = useApp();
  const l = labels[language];
  const sources = [
    ...new Map(
      evidence.map((source) => [`${source.id}-${source.url}`, source]),
    ).values(),
  ];
  return (
    <section className={s.statusPanel}>
      <h1>{t.graph}</h1>
      <p>{l.graphHint}</p>
      {sources.length ? (
        <>
          <EvidenceGraph
            evidence={sources}
            label={t.graph}
            hint={l.graphHint}
            unavailable={l.webglUnavailable}
          />
          {sources.map((source) => (
            <article key={`${source.id}-${source.url}`}>
              <div>
                <strong>{source.title}</strong>
                <small>
                  {source.source === "historical"
                    ? t.historical
                    : t.modernSource}
                </small>
              </div>
              {safeSourceUrl(source.url) && (
                <a
                  href={safeSourceUrl(source.url)}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                >
                  {t.sourceLink}
                </a>
              )}
            </article>
          ))}
        </>
      ) : (
        <p>{t.noSources}</p>
      )}
    </section>
  );
}
