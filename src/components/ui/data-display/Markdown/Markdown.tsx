import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeSourceUrl } from "@/lib/types";
import s from "./Markdown.module.css";
export function Markdown({ text }: { text: string }) {
  return (
    <div className={s.markdown}>
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) =>
            safeSourceUrl(href || "") ? (
              <a
                href={safeSourceUrl(href || "")}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          img: () => null,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
