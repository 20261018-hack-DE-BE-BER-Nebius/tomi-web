"use client";
import DOMPurify from "dompurify";
import Image from "next/image";
import { useEffect, useState } from "react";
import s from "./MermaidDiagram.module.css";
import { validateDiagramSource } from "./source";
export function MermaidDiagram({
  source,
  label,
  loading,
  invalid,
}: {
  source: string;
  label: string;
  loading: string;
  invalid: string;
}) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    let objectUrl = "";
    setFailed(false);
    setUrl("");
    async function render() {
      try {
        if (!validateDiagramSource(source))
          throw new Error("Unsupported diagram");
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          suppressErrorRendering: true,
          maxTextSize: 12000,
          maxEdges: 80,
          htmlLabels: false,
          flowchart: { htmlLabels: false, curve: "basis", useMaxWidth: true },
          theme: "dark",
          themeVariables: {
            primaryColor: "#21331a",
            primaryTextColor: "#f1f4eb",
            primaryBorderColor: "#76b900",
            lineColor: "#a5db3a",
            secondaryColor: "#151c12",
            tertiaryColor: "#182312",
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
          },
        });
        const { svg } = await mermaid.render(
          `tomi-diagram-${crypto.randomUUID()}`,
          source,
        );
        const clean = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
          FORBID_TAGS: ["foreignObject", "a", "image", "script"],
        });
        objectUrl = URL.createObjectURL(
          new Blob([clean], { type: "image/svg+xml" }),
        );
        if (alive) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      } catch {
        if (alive) setFailed(true);
      }
    }
    void render();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);
  return (
    <div className={s.diagram} aria-busy={!url && !failed}>
      {failed ? (
        <p role="alert">{invalid}</p>
      ) : url ? (
        <Image src={url} alt={label} width={1400} height={780} unoptimized />
      ) : (
        <p>{loading}</p>
      )}
    </div>
  );
}
