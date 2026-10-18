# Five-minute Tomi walkthrough

Use a landscape browser viewport and the actual deployed system. Keep the selected language EN for this recording. The deck supports EN, ES, DE and FR; briefly switch a language only if it fits the narration. Do not replace a failed model call with a fabricated answer.

| Time | View | Action and narration |
| --- | --- | --- |
| 00:00–00:25 | `/deck/202610181800#slide-1` | Introduce Tomi TimeLens as a workspace for comparing historical Britannica with modern Wikipedia using original passages. The landing screenshot is an actual product capture. |
| 00:25–00:50 | `#slide-2` | Explain why a similar title is insufficient: changing terminology, OCR errors and mismatched passages can mislead a comparison. |
| 00:50–01:40 | `/chat` | Use demo access, choose an actually available model and ask “Compare historical and modern shipbuilding techniques. Explain source limitations.” Show the real connection and activity while the answer runs. If the call is slow, keep the footage authentic and explain the visible stage. |
| 01:40–02:20 | Answer and source cards | Read one substantive comparison, expand one full passage, then show the original source link and the uncertainty text. The selected model name remains visible. |
| 02:20–02:55 | `/canvas` | Open the latest conversation's source passages without importing a file. Filter the sources, switch to the cards view, and refresh once to show persisted evidence. State that spatial positions are visual organization, not similarity scores. |
| 02:55–03:35 | `/archive/` | Open an actual parsed historical page. Show its scan, OCR region overlay, escaped LaTeX source and generated PDF. Describe the OCR as a model extraction, not a certified transcription. Only record after the archive assets have passed acceptance. |
| 03:35–04:10 | `/deck/202610181800#slide-5` | Explain the browser, Rust backend, AI Core, Hermes and persistence boundaries. Open the Mermaid editor to show that the architecture remains editable. Provider credentials remain in AI Core. |
| 04:10–04:40 | `#slide-6` and live service status | Distinguish verified Parse3.5 extraction and Super VL provider inference from embedding and reranking still awaiting verification. If new receipts establish those stages, update the slide before recording. |
| 04:40–05:00 | `#slide-7` | Return to the workspace/canvas/archive links. Close on the inspectable source trail and the current implementation, without asserting the full required pipeline has passed. |

## Source captures

- `verification/screenshots/azure-landing.jpg`: actual deployed landing page.
- `verification/screenshots/azure-comparison-light.jpg`: actual gpt-6-astra shipbuilding comparison.
- `verification/screenshots/azure-comparison-trace.jpg`: actual source limitations and service event view.
- Optimized display copies and SHA-256 provenance: `verification/deck-asset-provenance.json`.

The deck is a native React presentation. `public/deck/architecture.mmd` is the editable architecture source. The live canvas contains the authenticated conversation's real evidence, not preloaded demonstration content.
