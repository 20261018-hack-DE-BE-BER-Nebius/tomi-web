import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "./Markdown";

test("renders markdown without active HTML or dangerous links", () => {
  const html = renderToStaticMarkup(
    <Markdown
      text={
        "### Evidence\n**Important** [source](https://en.wikipedia.org/wiki/Astronomy)\n<script>alert(1)</script>\n[x](javascript:alert(1))"
      }
    />,
  );
  expect(html).toContain("<h3>Evidence</h3>");
  expect(html).toContain("<strong>Important</strong>");
  expect(html).not.toContain("<script");
  expect(html).not.toContain("javascript:");
  expect(html).toContain("noopener noreferrer");
});
