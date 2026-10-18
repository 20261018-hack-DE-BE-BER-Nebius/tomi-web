import { expect, test } from "bun:test";
import { validateDiagramSource } from "@/components/ui/data-display/MermaidDiagram/source";
import { architectureByLanguage, defaultDiagram } from "./architecture";
import labels from "./labels.json";
import slides from "./slides.json";

test("every deck section and editor label has all four language variants", () => {
  for (const lang of ["en", "es", "de", "fr"] as const) {
    expect(validateDiagramSource(architectureByLanguage[lang])).toBe(true);
    expect(slides[lang]).toHaveLength(7);
    expect(
      slides[lang].every(
        (slide) => slide.length === 4 && slide.every((text) => text.trim()),
      ),
    ).toBe(true);
    expect(Object.keys(labels[lang])).toEqual(Object.keys(labels.en));
  }
  expect(validateDiagramSource(defaultDiagram)).toBe(true);
});
