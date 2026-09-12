// Archive-data abstraction for the Wayback Machine.
// UI code must use these helpers (or the /api/snapshots route) —
// never fetch archive.org directly.

export type ArchiveErrorCode =
  | "INVALID_URL"
  | "NO_SNAPSHOTS"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR";

export class ArchiveError extends Error {
  readonly code: ArchiveErrorCode;
  constructor(code: ArchiveErrorCode, message: string) {
    super(message);
    this.name = "ArchiveError";
    this.code = code;
  }
}

export interface Snapshot {
  timestamp: string; // e.g. "20100101000000"
  original: string; // original URL as captured
  year: number;
  displayDate: string; // e.g. "Jan 1, 2010"
}

export interface Era {
  year: number;
  label: string;
  snapshotCount: number;
  firstCapture: string; // display date of the year's first snapshot
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Normalize user input to an absolute http(s) URL. Throws ArchiveError. */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new ArchiveError("INVALID_URL", "Empty URL.");
  }
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new ArchiveError("INVALID_URL", `Not a valid URL: ${input}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ArchiveError("INVALID_URL", `Unsupported scheme: ${parsed.protocol}`);
  }
  if (!parsed.hostname.includes(".")) {
    throw new ArchiveError("INVALID_URL", `Not a valid website: ${input}`);
  }
  return parsed.toString();
}

/** Safe wrapper for form validation — never throws. */
export function validateUrl(
  input: string
): { ok: true; url: string } | { ok: false; error: string } {
  try {
    return { ok: true, url: normalizeUrl(input) };
  } catch (e) {
    const message =
      e instanceof ArchiveError ? e.message : "That doesn't look like a website.";
    return { ok: false, error: message };
  }
}

function formatTimestamp(ts: string): string {
  const year = Number(ts.slice(0, 4));
  const month = Number(ts.slice(4, 6));
  const day = Number(ts.slice(6, 8));
  if (!year || !month || !day) return ts;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/**
 * Parse a CDX `output=json` response (array of arrays, first row is the
 * header) into snapshots. Drops dupes, non-200s, and malformed rows.
 */
export function parseCdxResponse(json: unknown): Snapshot[] {
  if (!Array.isArray(json) || json.length === 0) return [];
  const seen = new Set<string>();
  const out: Snapshot[] = [];
  for (const row of json.slice(1)) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const [/* urlkey */, timestamp, original, /* mimetype */, statuscode] = row.map(String);
    if (!/^\d{14}$/.test(timestamp)) continue;
    if (statuscode !== "200") continue;
    if (seen.has(timestamp)) continue;
    seen.add(timestamp);
    out.push({
      timestamp,
      original,
      year: Number(timestamp.slice(0, 4)),
      displayDate: formatTimestamp(timestamp),
    });
  }
  return out;
}

/** Public replay URL for a snapshot (with Wayback toolbar). */
export function buildSnapshotUrl(s: Snapshot): string {
  return `https://web.archive.org/web/${s.timestamp}/${s.original}`;
}

/**
 * Embed URL for the viewer iframe. The `id_` flag serves the original
 * archived bytes without Wayback toolbar injection.
 */
export function buildIframeUrl(s: Snapshot): string {
  return `https://web.archive.org/web/${s.timestamp}id_/${s.original}`;
}

/**
 * Group snapshots into one era per year. Labels describe only what the
 * data shows (position in history, capture counts) — never invented events.
 */
export function deriveEras(snaps: Snapshot[]): Era[] {
  const byYear = new Map<number, Snapshot[]>();
  for (const s of snaps) {
    const list = byYear.get(s.year) ?? [];
    list.push(s);
    byYear.set(s.year, list);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  return years.map((year, i) => {
    const list = byYear.get(year)!;
    let label: string;
    if (i === 0) label = "Earliest archived capture";
    else if (i === years.length - 1) label = "Most recent capture";
    else label = "Archived captures";
    return {
      year,
      label,
      snapshotCount: list.length,
      firstCapture: list[0].displayDate,
    };
  });
}
