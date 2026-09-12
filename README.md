# Digital Archaeologist

An interactive time machine for exploring how websites have evolved —
a digital museum for the web. Enter any website, scrub through its archived
captures on a timeline, and compare eras side by side.

Built with Next.js + TypeScript + Tailwind. All snapshots are real captures
from the Internet Archive's Wayback Machine; nothing is fabricated.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Other commands: `npm run build`, `npm test` (vitest), `npm run lint`.

## How it works

```
UI  →  /api/snapshots?url=  →  Wayback CDX API (HTTPS)
```

- `lib/archive/wayback.ts` owns all archive logic: URL validation,
  CDX parsing, snapshot/iframe URL builders, yearly collapsing, era
  derivation. UI components never fetch archive.org directly.
- `app/api/snapshots/route.ts` queries the CDX API in parallel time
  windows (one row per year), merges a newest-first tail, gap-fills missing
  years, and caches for 10 minutes. Failures map to honest states:
  invalid URL (400), no snapshots (404), rate-limited (429), upstream
  flaky (502).
- Archived pages render in sandboxed iframes served from
  `web.archive.org/...id_/...` (original bytes, no toolbar injection).

## Honesty rules

- Every marker on the timeline is a genuine Wayback capture.
- Year gaps mean no capture exists — shown as-is, flagged `partial record`
  when a lookup couldn't cover the full span.
- The evolution section derives only from real snapshot metadata.
- The AI Archaeologist panel is a disabled placeholder until a real
  provider is wired in (`lib/ai/stub.ts`). No synthetic analysis, ever.

## Motion

No animation libraries. CSS transitions + WAAPI-friendly classes only:
transform/opacity, ≤250ms, ease-out, full `prefers-reduced-motion`
fallbacks. Buttons scale on press, snapshots crossfade with a whisper of
blur, the comparison divider drags with pointer capture.

## Credits

Snapshots courtesy of the [Internet Archive](https://archive.org).
Set `SITE.githubUrl` in `lib/site.ts` to the published repository URL.
