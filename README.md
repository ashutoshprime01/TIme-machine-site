# Internet Time Machine

**Street View for the Internet.** Search any website, travel through its
archived history, compare eras, and measure how it evolved — deterministically,
with **$0 API cost** and **no paid AI dependency**.

Built from `internet_time_machine_full_comprehensive_plan.txt` — this repo
implements the plan's **first milestone**: Search → Timeline → Historical
Snapshot → Compare → Basic Internet DNA → Shareable URL.

## What's implemented

| Plan module | Status |
|---|---|
| Homepage (§7) | ✅ hero, search, examples, actions |
| Search + URL normalization (§8) | ✅ handles scheme, `www.`, paths, query params |
| Archive provider abstraction (§29) | ✅ `ArchiveProvider` interface + Wayback CDX provider |
| Entity page + timeline (§9, §11) | ✅ years with data only, capture density, nearest-capture |
| Historical viewer (§10) | ✅ sandboxed cross-origin iframe, scripts disabled |
| Snapshot navigation (§11) | ✅ prev/next, year jump, zoom, source attribution (§68) |
| Deterministic analysis (§13, §27) | ✅ content/structure/design metrics + tech fingerprinting |
| Internet DNA (§15–16) | ✅ 12 dimensions, versioned formulas, heuristic-labeled |
| Comparison mode (§12) | ✅ side-by-side, slider, change meters, detected changes (FACT/INFERENCE) |
| Evolution Engine (§17–19, §46) | ✅ per-year sampling, evolution score, detected events, cross-year charts |
| Sharing (§35) | ✅ `/share/<domain>-<yearA>-vs-<yearB>-<id>` with OG metadata |
| Security (§33) | ✅ SSRF guards, sandbox isolation, input sanitization, rate limiting |
| Caching (§30) | ✅ content-hash reuse, two-layer cache (memory + disk) |
| Data model (§28) | ✅ Entity / Snapshot / Analysis / Dna / Share with indexes |

Not yet (per plan phases): Evolution Lab,
counterfactuals, future scenarios, accounts, collections, discovery.

## Getting started

```bash
npm install        # also runs `prisma generate`
npx prisma db push # creates the local SQLite database
npm run dev        # http://localhost:3000
```

No API keys, no accounts, no external services to configure. The app talks to
the public [Wayback Machine CDX API](https://web.archive.org/cdx/search/cdx).

**Production / PostgreSQL** (plan §54): set
`DATABASE_URL="postgresql://…"` in `.env`, change the provider in
`prisma/schema.prisma` to `postgresql`, run `npx prisma db push`, then
`npm run build && npm start`. Everything else is provider-agnostic.

## Architecture

```
Next.js (App Router, React 19, TypeScript, Tailwind v4)
        │
        ├── app/                     pages (server-rendered, streamed via Suspense)
        │     ├── entity/[domain]            timeline + captures
        │     │     ├── snapshot/[timestamp] viewer + measurements + DNA
        │     │     └── compare              two-version comparison
        │     ├── share/[slug]               shared comparisons
        │     └── api/share                  share-link creation (rate-limited)
        │
        ├── lib/
        │     ├── archive/            ArchiveProvider abstraction
        │     │     ├── wayback.ts    CDX provider (windowed queries, throttle,
        │     │     │                  backoff, timeouts, bounded concurrency)
        │     │     └── index.ts      ArchiveService — the only entry point
        │     ├── analysis/           deterministic HTML engine (cheerio),
        │     │                        change detection, persistence service
        │     ├── dna/                Internet DNA scoring (versioned)
        │     ├── security/           URL normalization + SSRF guards
        │     ├── cache/              memory + disk cache keyed by SHA-256
        │     └── rate-limit.ts       sliding-window limiter
        │
        └── prisma/schema.prisma      Entity / Snapshot / Analysis / Dna / Share
```

### Design decisions worth knowing

- **Archived HTML is untrusted.** It renders only inside a cross-origin
  iframe at `web.archive.org` with `sandbox=""` — no scripts, no same-origin,
  no forms, no popups. Nothing from an archive executes in this app.
- **Analysis is on demand** (plan §55). Nothing is pre-crawled; a snapshot is
  fetched and analyzed when a user first views it, then persisted with a
  content hash (SHA-256) so identical content is never re-analyzed.
- **CDX queries are date-windowed.** Full-range queries for heavily-crawled
  domains (google.com…) can time out server-side, so searches are issued as
  ≤5-year windows with bounded concurrency, merged, deduplicated and cached.
  Partial results are marked incomplete in the UI and re-cached sooner.
- **Facts vs. interpretation.** Every user-visible claim is labeled FACT
  (direct observation) or INFERENCE (interpretation) — the plan's most
  important product rule (§2, §77).
- **Versioned analysis.** Analyses and DNA scores carry algorithm versions
  (`Analysis v1.0`, `DNA v1.0`) so improved formulas can be regenerated and
  compared without silently rewriting history (§69–70).
- **Zero-cost by construction.** No paid APIs anywhere; optional local AI
  (plan §22, §58) will slot behind an `AIProvider` interface later.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | development server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | production server |
| `npm run db:push` | apply schema to the database |
| `node scripts/db-check.cjs` | inspect stored analyses (dev utility) |

## Attribution & legal

Snapshots come from the [Internet Archive](https://archive.org) Wayback
Machine. This project claims no ownership of archived material, links back to
every source capture, and only retrieves what users request. See `/about` in
the app for the full methodology, provenance and limits statement.
