# Digital Archaeologist — Design Spec

Date: 2026-09-12. Status: approved by user (live-iframe rendering).

## Goal

Interactive time machine for exploring how websites evolved, using real
Internet Archive / Wayback Machine data. Portfolio-grade GitHub project.

## Architecture

Next.js App Router + TypeScript + Tailwind, single project dir
`digital-archaeologist/`. No framer-motion — motion is CSS transitions +
WAAPI only (Emil rules: transform/opacity only, <250ms, ease-out,
reduced-motion fallback).

Data flow: UI -> `/api/snapshots?url=` route handler -> CDX API over
HTTPS (`collapse=year:4`, `filter=statuscode:200`, `filter=mimetype:text/html`,
`collapse=digest` to drop dupes) -> JSON snapshot list. Availability API
used only for the "closest snapshot" quick check. All archive logic lives
in `lib/archive/wayback.ts`; components never fetch archive.org directly.

Rendering: archived page in `<iframe sandbox>` with
`https://web.archive.org/web/{timestamp}id_/{originalUrl}`.
`id_` flag = original archived bytes, no Wayback toolbar injection.

## Pages / components

- `app/page.tsx` — landing: header (DIGITAL ARCHAEOLOGIST + Explore/About/GitHub),
  hero ("Explore the history of the web."), URL input + Explore button,
  preset site shortcuts.
- `app/explore/page.tsx` — explorer: site title, THE HISTORY OF THIS WEBSITE,
  ArchiveViewer + Timeline + Comparison + Evolution + AI placeholder.
- `components/archive-viewer/` — browser-chrome frame, capture date,
  historical URL, year badge, loading ("EXCAVATING THE WEB...") state.
- `components/timeline/` — styled native `input[type=range]` (keyboard/touch
  accessible) + snapshot marker buttons + year labels. Scrub updates viewer
  with crossfade+blur transition.
- `components/comparison/` — two iframes, draggable width divider,
  stacks vertically on mobile.
- `components/evolution/` — era list derived ONLY from real snapshot metadata
  (first capture, span, count per era). No invented events.
- `components/ai-archaeologist/` — disabled placeholder + `lib/ai/` stub
  interface (no fake analysis, ever).
- `components/ui/` — error states with exact spec copy (invalid URL,
  no archive, rate-limited, network failure), header, footer.

## Error handling

Route handler maps: invalid URL -> 400; CDX empty -> 404 (NO HISTORICAL
LAYERS FOUND); upstream 429 -> 429 (rate-limit copy); fetch failure -> 502.
Client renders matching designed states. In-memory cache (10 min TTL) in
the route handler to reduce upstream pressure.

## Accessibility / responsive / performance

Semantic HTML, visible focus, labels on all controls, contrast-checked,
`prefers-reduced-motion` disables movement (opacity-only), touch targets
>= 44px. Mobile: timeline usable full-width, viewer adapts, comparison
vertical, nav collapses. Lazy iframe loading, no layout-property animation.

## Verification

`tsc --noEmit`, eslint, vitest unit tests (`lib/archive/` pure functions:
URL normalize/validate, CDX parse, snapshot/iframe URL builders),
`next build`, headless screenshot review of landing + explorer states.
