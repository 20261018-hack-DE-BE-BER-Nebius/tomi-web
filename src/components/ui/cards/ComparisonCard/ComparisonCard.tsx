import { Icon } from "@/components/ui/buttons/Icon/Icon";
import { Markdown } from "@/components/ui/data-display/Markdown/Markdown";
import type en from "@/lib/i18n/en.json";
import { type Answer, safeSourceUrl } from "@/lib/types";
import s from "./ComparisonCard.module.css";
export function ComparisonCard({
  answer,
  labels,
}: {
  answer: Answer;
  labels: typeof en;
}) {
  return (
    <article className={s.card}>
      <header>
        <span>
          <Icon name="spark" />
          {labels.comparison}
        </span>
        {answer.model && <small>{answer.model}</small>}
      </header>
      <h2>{answer.title}</h2>
      <div className={s.summary}>
        <Markdown text={answer.summary} />
      </div>
      <div className={s.categories}>
        {answer.categories.map((category) => (
          <span key={category.name} title={category.description}>
            {category.name}
          </span>
        ))}
      </div>
      <div className={s.sources}>
        {answer.evidence.map((source) => (
          <section
            key={source.id}
            className={source.source === "historical" ? s.historical : s.modern}
          >
            <div className={s.sourceType}>
              <Icon name="book" />
              {source.source === "historical"
                ? labels.historical
                : labels.modernSource}
            </div>
            <h3>{source.title}</h3>
            <blockquote>
              {source.excerpt.length > 560
                ? `${source.excerpt.slice(0, 560).trimEnd()}…`
                : source.excerpt}
            </blockquote>
            {source.excerpt.length > 560 && (
              <details className={s.passage}>
                <summary>{labels.fullPassage}</summary>
                <blockquote>{source.excerpt}</blockquote>
              </details>
            )}
            {safeSourceUrl(source.url) && (
              <a
                href={safeSourceUrl(source.url)}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
              >
                {labels.sourceLink}
                <Icon name="external" />
              </a>
            )}
            <small>{source.id}</small>
          </section>
        ))}
      </div>
      {!answer.evidence.length && <p className={s.empty}>{labels.noSources}</p>}
      {answer.uncertainty.length > 0 && (
        <aside className={s.uncertainty}>
          <strong>{labels.uncertainty}</strong>
          <ul>
            {answer.uncertainty.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      )}
      <footer>{labels.sourceNote}</footer>
    </article>
  );
}
