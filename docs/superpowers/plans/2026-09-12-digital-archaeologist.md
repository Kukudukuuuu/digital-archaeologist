# Digital Archaeologist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Digital Archaeologist — Wayback-powered website history explorer — as a polished Next.js portfolio project.

**Architecture:** App Router UI -> `/api/snapshots` route handler -> CDX API (HTTPS). All archive logic in `lib/archive/wayback.ts`. Motion: CSS/WAAPI only, no animation deps.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind, vitest (devDep, unit tests for pure functions only).

**Spec:** `docs/superpowers/specs/2026-09-12-digital-archaeologist-design.md`

## Global Constraints

- All work inside `/home/kuku/Documents/hermes/digital-archaeologist`.
- Never fabricate snapshots, dates, events, stats, or AI analysis.
- `lib/archive/wayback.ts` owns archive logic; components never fetch archive.org.
- Motion: transform/opacity only, <=250ms UI transitions, ease-out, reduced-motion fallback.
- Verify each task before marking done; commit per task.

---

### Task 1: Scaffold + baseline

**Files:** Create: Next.js app files at repo root (`app/`, `package.json`, etc. via create-next-app into tmp dir then merged; existing `docs/` + `.git` preserved).

**Steps:**
- [ ] Run: `npx create-next-app@latest digital-archaeologist-tmp --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm` from `/home/kuku/Documents/hermes`
- [ ] Merge tmp contents into `digital-archaeologist/`, remove tmp, `npm install`
- [ ] Run: `npm run build` — Expected: PASS (baseline)
- [ ] Commit: `git add -A && git commit -m "chore: scaffold Next.js app"`

### Task 2: Archive library (TDD)

**Files:** Create: `lib/archive/wayback.ts`, `lib/archive/wayback.test.ts`. Install: `vitest` devDep + `npm run test` script.

**Interfaces:**
- Consumes: nothing.
- Produces: `normalizeUrl(input: string): string` (throws `UrlError` on invalid),
  `validateUrl(input: string): { ok: true; url: string } | { ok: false; error: string }`,
  `parseCdxResponse(json: unknown): Snapshot[]`,
  `buildSnapshotUrl(s: Snapshot): string` (web.archive.org/web/{ts}/{orig}),
  `buildIframeUrl(s: Snapshot): string` (`.../web/{ts}id_/{orig}`),
  `deriveEras(snaps: Snapshot[]): Era[]` (from real metadata only),
  types `Snapshot { timestamp, original, year, displayDate }`, `Era { year, label }`,
  `ArchiveError` with codes `INVALID_URL | NO_SNAPSHOTS | RATE_LIMITED | UPSTREAM_ERROR`.

**Steps:**
- [ ] Write `wayback.test.ts` with failing-first cases: valid/invalid URLs (`not a url`, `http://`, `youtube.com`, `https://youtube.com/watch?v=x` -> hostname+path kept), CDX parse of a 3-row fixture incl. header row + dupe timestamps, iframe URL contains `id_`, eras from fixture years.
- [ ] Run: `npx vitest run` — Expected: FAIL (module missing).
- [ ] Implement `wayback.ts` minimal to pass.
- [ ] Run: `npx vitest run` — Expected: PASS. Run `npx tsc --noEmit` — Expected: PASS.
- [ ] Commit: `feat: add archive library with unit tests`.

### Task 3: Snapshots API route

**Files:** Create: `app/api/snapshots/route.ts`. Reuses Task 2 functions.

**Interfaces:** `GET /api/snapshots?url=` -> `{ input, snapshots: Snapshot[] }` or `{ error, code }` with status 400/404/429/502. In-memory cache, 10-min TTL, max ~200 entries.

**Steps:**
- [ ] Implement route: validate -> cache check -> CDX fetch (`https://web.archive.org/cdx/search/cdx?url={host+path}&output=json&filter=statuscode:200&filter=mimetype:text/html&collapse=digest&collapse=timestamp:4&limit=...`) -> parse -> error map (429->RATE_LIMITED etc.).
- [ ] Verify: `npm run dev` + `curl "localhost:3000/api/snapshots?url=youtube.com"` returns snapshots; `?url=not a url` returns 400; `?url=https://no-such-site-xyz-12345.com` returns 404.
- [ ] Commit: `feat: add snapshots API route`.

### Task 4: Design system + shell

**Files:** Create/modify: `app/globals.css` (theme tokens: ink/paper, serif display + mono, grain overlay, thin borders, focus rings), `app/layout.tsx` (fonts, metadata), `components/ui/site-header.tsx`, `components/ui/site-footer.tsx`.

**Steps:**
- [ ] Implement theme + header (DIGITAL ARCHAEOLOGIST / Explore About GitHub) + footer.
- [ ] Verify: dev server renders, header nav works, focus states visible, reduced-motion media query present.
- [ ] Commit: `feat: add design system and site shell`.

### Task 5: Landing page

**Files:** Create: `app/page.tsx`, `components/hero/url-form.tsx` (client: input + validation via `validateUrl`, router.push `/explore?url=`), preset shortcuts (youtube.com, wikipedia.org, apple.com).

**Steps:**
- [ ] Implement hero, form (Enter submits, invalid shows THAT DOESN'T LOOK LIKE A WEBSITE.), presets.
- [ ] Verify: type a bad URL -> error copy; good URL -> navigates to /explore?url=.
- [ ] Commit: `feat: add landing page`.

### Task 6: Explorer page + viewer

**Files:** Create: `app/explore/page.tsx` (client, searchParams), `components/archive-viewer/archive-viewer.tsx` (browser chrome, iframe, capture date, loading EXCAVATING THE WEB...).

**Steps:**
- [ ] Fetch `/api/snapshots?url=` on mount; states: loading / error (mapped copy) / empty / ready (latest snapshot selected by default).
- [ ] Verify with youtube.com: viewer shows archived page; bad url param shows invalid state; screenshot via helium.
- [ ] Commit: `feat: add explorer page and archive viewer`.

### Task 7: Timeline

**Files:** Create: `components/timeline/timeline.tsx` (range input + markers + year labels, crossfade/blur swap via key change + CSS).

**Steps:**
- [ ] Scrub/drag updates selection; markers are buttons; arrow keys work natively; touch works; `prefers-reduced-motion` disables blur/slide.
- [ ] Verify: drag across years swaps iframe; keyboard-only navigation reaches every snapshot; mobile width usable (helium screenshot at 390px).
- [ ] Commit: `feat: add timeline`.

### Task 8: Comparison + evolution + AI placeholder

**Files:** Create: `components/comparison/comparison.tsx` (two iframes, pointer-drag divider, vertical on mobile), `components/evolution/evolution.tsx`, `components/ai-archaeologist/ai-archaeologist.tsx` + `lib/ai/stub.ts` interface.

**Steps:**
- [ ] Comparison defaults: oldest vs newest; divider drag resizes (pointer capture, % widths).
- [ ] Evolution renders `deriveEras` output only; AI panel renders disabled placeholder, zero fake text.
- [ ] Verify: drag divider; narrow viewport stacks; no fabricated copy anywhere (grep for year claims outside data).
- [ ] Commit: `feat: add comparison, evolution, AI placeholder`.

### Task 9: Final review

**Files:** Modify: fix list from review. Create: `README.md` (what/why, stack, Wayback credit, run instructions, honesty notes).

**Steps:**
- [ ] Design review (checklist from prompt: unique? museum feel? tactile timeline? typography? mobile designed? states polished? not generic?).
- [ ] Engineering review: `npx tsc --noEmit` PASS, `npm run lint` PASS, `npx vitest run` PASS, `npm run build` PASS.
- [ ] Helium screenshots: landing desktop+mobile, explorer with real site, comparison, error state.
- [ ] Commit: `docs: add README` + fixes. Report results.
