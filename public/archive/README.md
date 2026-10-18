# Compiled Britannica archive

From this directory, run `python3 -m http.server 8090` and open `http://localhost:8090/`. The deployed application serves the same archive at `/archive/`.

All 100 selected source images and actual Parse 3.5 responses are retained. The PDFs are compiled from escaped, reflowed LaTeX. Source order, headings, paragraph blocks and captions are retained; original scans show the source layout, and raw JSON retains Parse coordinates and exact OCR. Errors remain visible. The viewer displays a first-page image rendered from each compiled PDF and links to the complete PDF.

`latex/main.tex` includes one source per selected page. Compile with Tectonic 0.17.0. This build uses macOS Arial Unicode MS with Kefa III for the single Ethiopic OCR glyph on row 1904. Install compatible fonts or adjust `fontspec` when rebuilding on another system. The app preview compiler cannot access these system fonts; the terminal compiler successfully produced the verified PDFs.

The sample contains 100 of 2,573 rows, selected without replacement using seed 20261016 and dataset revision `309f765b1ecc83e0a7f7762e44b4a927a7555443`. Source: National Library of Scotland, CC0-1.0. There are 98 accepted full-page responses, a partial illustration on row 2243, and a non-text cover on row 452. Accepted output is not a manual OCR accuracy score.

`assets/compile-receipt.json` contains PDF hashes and pagination. `assets/pages.json` contains original Parse text, source hashes, attribution, and retained block metadata. The 100 source pages compile into 187 PDF pages including the introductory page.
