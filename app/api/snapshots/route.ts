import { NextRequest, NextResponse } from "next/server";
import {
  ArchiveError,
  collapseToYearly,
  normalizeUrl,
  parseCdxResponse,
  type Snapshot,
} from "@/lib/archive/wayback";

// Tiny in-memory cache: Wayback CDX is rate-limited and flaky, so repeated
// lookups of the same site within TTL reuse the upstream response.
const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 200;
const FETCH_TIMEOUT_MS = 45000;
const cache = new Map<string, { at: number; snapshots: Snapshot[] }>();

function cacheGet(key: string): Snapshot[] | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.snapshots;
}

function cacheSet(key: string, snapshots: Snapshot[]) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), snapshots });
}

function errorBody(code: string, error: string) {
  return { error, code };
}

function cdxUrl(target: URL, extra: string): string {
  return (
    `https://web.archive.org/cdx/search/cdx` +
    `?url=${encodeURIComponent(target.host + target.pathname + target.search)}` +
    `&output=json&filter=statuscode:200&filter=mimetype:text/html${extra}`
  );
}

async function fetchJson(url: string): Promise<unknown | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "digital-archaeologist/1.0 (portfolio project)" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (res.status === 429) return "RATE_LIMITED";
      if (!res.ok) continue; // retry once, then fall through
      return (await res.json()) as unknown;
    } catch {
      // network error / timeout — wait briefly, then retry
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("url") ?? "";

  let normalized: string;
  try {
    normalized = normalizeUrl(input);
  } catch (e) {
    const message =
      e instanceof ArchiveError ? "That doesn't look like a website." : "Invalid URL.";
    return NextResponse.json(errorBody("INVALID_URL", message), { status: 400 });
  }

  const cached = cacheGet(normalized);
  if (cached) {
    return NextResponse.json({ input: normalized, snapshots: cached, cached: true });
  }

  const target = new URL(normalized);

  // Primary: one row per year, queried in time windows in parallel.
  // A single collapsed query over a mega-site's whole history times out
  // server-side, so windows keep each scan bounded. Merged client-side.
  const WINDOWS: Array<[string, string]> = [
    ["1996", "2004"],
    ["2005", "2009"],
    ["2010", "2014"],
    ["2015", "2019"],
    ["2020", "2030"],
  ];
  const fetchWindow = ([from, to]: [string, string]) =>
    fetchJson(cdxUrl(target, `&from=${from}&to=${to}&collapse=timestamp:4&limit=1000`));
  const windowResults = await Promise.all(WINDOWS.map(fetchWindow));
  if (windowResults.some((r) => r === "RATE_LIMITED")) {
    return NextResponse.json(
      errorBody("RATE_LIMITED", "The archive is rate-limiting requests. Try again in a moment."),
      { status: 429 }
    );
  }
  // Retry windows that errored before accepting a partial timeline.
  const failedIdx = windowResults
    .map((r, i) => (r === null ? i : -1))
    .filter((i) => i >= 0);
  if (failedIdx.length > 0) {
    const retries = await Promise.all(failedIdx.map((i) => fetchWindow(WINDOWS[i])));
    retries.forEach((r, k) => {
      if (r === "RATE_LIMITED") windowResults[failedIdx[k]] = r;
      else if (r !== null) windowResults[failedIdx[k]] = r;
    });
  }
  if (windowResults.some((r) => r === "RATE_LIMITED")) {
    return NextResponse.json(
      errorBody("RATE_LIMITED", "The archive is rate-limiting requests. Try again in a moment."),
      { status: 429 }
    );
  }
  let rows: unknown[] = [];
  for (const r of windowResults) {
    if (Array.isArray(r)) rows = rows.concat(r);
  }
  // Cheap newest-first tail: reverse-index traversal, covers recent years
  // even when a late window times out.
  const tail = await fetchJson(cdxUrl(target, `&limit=-300`));
  if (tail === "RATE_LIMITED") {
    return NextResponse.json(
      errorBody("RATE_LIMITED", "The archive is rate-limiting requests. Try again in a moment."),
      { status: 429 }
    );
  }
  if (Array.isArray(tail)) rows = rows.concat(tail);
  let partial = windowResults.some((r) => r === null);
  let json: unknown | null = rows.length > 0 ? rows : null;

  // Gap-fill: years with no coverage get one cheap targeted query each
  // (first captures of that year; small limit short-circuits the scan).
  // Bounded to 12 requests to limit upstream pressure.
  if (json !== null) {
    const probe = parseCdxResponse(json);
    if (probe.length > 0) {
      const covered = new Set(probe.map((s) => s.year));
      const minY = Math.min(...covered);
      const maxY = new Date().getFullYear();
      const missing: number[] = [];
      for (let y = minY; y <= maxY && missing.length < 12; y++) {
        if (!covered.has(y)) missing.push(y);
      }
      if (missing.length > 0) {
        // Batches of 3: polite to the upstream, still parallel.
        for (let b = 0; b < missing.length; b += 3) {
          const batch = missing.slice(b, b + 3);
          const fills = await Promise.all(
            batch.map((y) => fetchJson(cdxUrl(target, `&from=${y}&to=${y}&limit=2`)))
          );
          fills.forEach((r) => {
            if (r === "RATE_LIMITED") return;
            if (Array.isArray(r)) rows = rows.concat(r);
          });
        }
        json = rows;
        // Recompute coverage: partial only if gaps truly remain.
        const recheck = new Set(parseCdxResponse(json).map((s) => s.year));
        partial = missing.some((y) => !recheck.has(y));
      }
    }
  }

  // Fallback for mega-sites where the collapsed query times out:
  // oldest 1500 + newest 1500 captures merged client-side by year.
  if (json === null) {
    const [oldest, newest] = await Promise.all([
      fetchJson(cdxUrl(target, `&limit=1500`)),
      fetchJson(cdxUrl(target, `&limit=-1500`)),
    ]);
    if (oldest === "RATE_LIMITED" || newest === "RATE_LIMITED") {
      return NextResponse.json(
        errorBody("RATE_LIMITED", "The archive is rate-limiting requests. Try again in a moment."),
        { status: 429 }
      );
    }
    const rows = [
      ...(Array.isArray(oldest) ? oldest : []),
      ...(Array.isArray(newest) ? newest : []),
    ];
    json = rows.length > 0 ? rows : null;
  }

  if (json === null) {
    return NextResponse.json(
      errorBody("UPSTREAM_ERROR", "The archive is temporarily unavailable. Try again in a moment."),
      { status: 502 }
    );
  }

  const snapshots = collapseToYearly(parseCdxResponse(json));
  if (snapshots.length === 0) {
    return NextResponse.json(
      errorBody("NO_SNAPSHOTS", "No historical layers found. We couldn't find an archived version of this website."),
      { status: 404 }
    );
  }

  if (!partial) cacheSet(normalized, snapshots);
  return NextResponse.json({ input: normalized, snapshots, cached: false, partial });
}
