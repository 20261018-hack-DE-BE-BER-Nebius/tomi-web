# tomi-web

The integrated Tomi TimeLens application: landing, demo sign-in, live evidence chat, real run traces, source replay, and pitch presentation.

## Setup

Requires Bun 1.4.3. For local container verification use Apple Container 1.5 or a compatible Docker engine.

```sh
bun install --frozen-lockfile
cp .env.example .env
bun run build
bun start
```

Set the variables in `.env` before starting. Never add provider API keys to this service. The browser calls its own origin; the web service proxies to the configured Rust backend.

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP listen port, normally 3000 in containers |
| `HOSTNAME` | Listen interface, normally 0.0.0.0 |
| `NODE_ENV` | production or development |
| `TOMI_BACKEND_URL` | Rust backend HTTP origin reachable by this service |
| `TOMI_PUBLIC_ORIGIN` | Exact browser-facing origin, including the port locally |
| `TOMI_WEB_IMAGE_TAG` | Local Compose image tag |

The backend must accept the same public origin for authenticated API and WebSocket traffic. To run a second chat frontend, configure its backend for that frontend's origin; do not relax the browser origin check.

## Build and verification

```sh
bun run lint
bun run typecheck
bun test
bun audit
gitleaks dir src --redact --no-banner
pre-commit install
container build -t tomi-web:dev .
```

The installed pre-commit hook runs a redacted Gitleaks scan against staged changes. The container dependency stage runs `bun audit`. `docker-compose.yml` is for local development only; production uses Azure Container Apps. Every build context is this repository alone. No build needs a sibling checkout.

## Interface and data flow

Styling uses CSS Modules for components and features, with design tokens and resets in `src/styles/globals.css`. The NVIDIA-inspired palette supports light and dark mode. User-facing labels and the pitch are available in EN, ES, DE, and FR; source quotations retain their original language.

Only supplied evidence is rendered. Safe Markdown skips HTML and validates outbound citation URLs. Long passages expand through native disclosure controls. Source positions in the 3D view are visual grouping, not semantic similarity scores. WebGL allocation is demand-driven and disposed on unmount.

The canvas, cards and source graph automatically open the current authenticated conversation. A bounded account-scoped browser snapshot retains the active conversation ID and real answers across navigation and reload; `/api/history` merges persisted service events. Signing out removes the snapshot. Interrupted runs remain interrupted after reload. Opening a new conversation resets the current canvas.

Replay viewers also accept `tomi-evidence-conversation-v1` JSON exports up to 10 MB. Import stays in the browser. Malformed records are rejected. The graph draws at most 120 nodes while the source table retains every imported source.

The PWA includes a manifest, 192/512 icons, an install prompt when the browser supports it, and a multilingual offline fallback. The service worker caches build-hashed public assets only. It never caches authenticated API replies or conversations.

## Realtime and voice setup

`server.mjs` serves Next.js and proxies same-origin `/ws` connections. Both web and Rust backend validate origin and session cookies. Browser credentials never appear in URL query parameters. The browser sends `chat.message`, `chat.steer`, and `chat.cancel`. The reducer follows successor run IDs after steering, keeps lifecycle/tool events, and uses text deltas for the visible response.

The composer supports `/compare`, `/image`, `/export`, `/clear`, `@britannica`, and `@wikipedia`. `/image` calls the configured core image provider and labels images as generated illustrations. Model availability is shown from the real service catalog.

Voice starts only after a user gesture. WebRTC negotiation calls `/api/realtime/connect`, keeping provider keys in the Rust AI core. Microphone mute changes the actual audio-track `enabled` state. Incoming `compare_sources` voice tool calls use the same evidence WebSocket; completed answers return to the voice data channel. End-call stops every microphone track. Configure the required provider and transcription model in the AI core. Speaker identity is not asserted by the browser.


The separate speaker-recording control records only after an explicit click. It reuses an active call microphone or requests its own audio-only stream; it can run without a Realtime provider. Stop, user end-call or the 59-second safety limit submits at most 1 MiB through `/api/diarize` for batch Nemotron-3-Diarization. Mute affects a reused call track. Discard, logout and unmount cancel pending uploads and release owned microphone tracks. Audio stays in browser memory, never local storage or conversation history. Returned anonymous speaker intervals are validated and displayed without identity or realtime claims. An explicit file picker submits WAV, MP3, WebM, Ogg or M4A clips through the same route and bounds. The Rust backend must proxy this route to the configured core CPU diarization runtime.

## Routes

- `/`: landing in the integrated web service; chat in the standalone chat service
- `/login`: configured account or one-click separate demo session
- `/chat`: live chat, model selector, source cards, traces, voice and source graph
- `/canvas`, `/graph`, `/evidence`: inspect the current conversation or an imported export
- `/deck/202610181800`: seven-section pitch with actual product captures, keyboard navigation and source-editable Mermaid architecture; `#slide-1` through `#slide-7` open a specific view
- `/archive/`: generated original-page archive with source files and PDF previews
- `/api/health`: frontend liveness

## Source synchronization

The integrated application is the canonical source for the shared presentation snapshot. These files are checked into each service so its build is independent. The integrated application's `scripts/sync-ui.ts` refreshes the approved source and configuration allowlist for all UI services; each service retains its own package name, environment and entry route. Install dependencies and rerun the checks after synchronization.

## Deck assets and architecture

`public/deck/` contains WebP copies of actual product captures. `verification/deck-asset-provenance.json` records their source files and hashes. The screenshot text is a historical capture; the verification slide distinguishes verified extraction from inference still awaiting proof. The diagram uses pinned Mermaid and DOMPurify, renders as an inert SVG image, and can export editable `.mmd` source. All labels remain available in four languages. The static archive uses external same-origin scripts under `script-src self`; Next.js routes retain per-request nonce and strict-dynamic protection. Neither route family allows inline scripts. Archive PDFs alone allow same-origin embedding; other pages reject framing.

The six original run receipts under `public/archive/receipts/` retain their exact source bytes and SHA-256 identity. A narrowly scoped Biome formatter override preserves those evidence files; lint, parsing, audit and secret checks remain enabled. `verification/archive-receipts.test.ts` checks every public receipt against the reviewed manifest before release.
