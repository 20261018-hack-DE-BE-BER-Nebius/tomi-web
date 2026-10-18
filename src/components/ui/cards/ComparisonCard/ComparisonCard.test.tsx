import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import en from "@/lib/i18n/en.json";
import { ComparisonCard } from "./ComparisonCard";

test("source text is escaped and unsafe links are omitted", () => {
  const html = renderToStaticMarkup(
    <ComparisonCard
      labels={en}
      answer={{
        title: "<script>bad</script>",
        summary: "Evidence",
        categories: [],
        evidence: [
          {
            id: "x",
            source: "historical",
            title: "Source",
            url: "javascript:alert(1)",
            excerpt: "<img src=x onerror=alert(1)>",
          },
        ],
        uncertainty: ["Not a verified comparison"],
      }}
    />,
  );
  expect(html).not.toContain("<script>bad");
  expect(html).toContain("&lt;img");
  expect(html).not.toContain("javascript:");
  expect(html).toContain(en.uncertainty);
});
