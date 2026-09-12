import { describe, expect, it } from "vitest";
import {
  ArchiveError,
  buildIframeUrl,
  buildSnapshotUrl,
  deriveEras,
  normalizeUrl,
  parseCdxResponse,
  validateUrl,
} from "./wayback";

const CDX_FIXTURE = [
  ["urlkey", "timestamp", "original", "mimetype", "statuscode", "digest", "length"],
  ["com,youtube)/", "20050428014715", "http://www.youtube.com:80/", "text/html", "200", "AAA", "2536"],
  // exact-dupe row (same timestamp) must be dropped
  ["com,youtube)/", "20050428014715", "http://www.youtube.com:80/", "text/html", "200", "AAA", "2536"],
  ["com,youtube)/", "20100101000000", "http://www.youtube.com/", "text/html", "200", "BBB", "3100"],
  // non-200 must be dropped
  ["com,youtube)/", "20110101000000", "http://www.youtube.com/", "text/html", "404", "CCC", "100"],
];

describe("normalizeUrl", () => {
  it("adds https when the scheme is missing", () => {
    expect(normalizeUrl("youtube.com")).toBe("https://youtube.com/");
  });

  it("keeps paths and query strings", () => {
    expect(normalizeUrl("youtube.com/watch?v=x")).toBe("https://youtube.com/watch?v=x");
  });

  it("keeps an explicit http scheme", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("throws ArchiveError INVALID_URL for garbage", () => {
    expect(() => normalizeUrl("not a url")).toThrow(ArchiveError);
    try {
      normalizeUrl("not a url");
    } catch (e) {
      expect((e as ArchiveError).code).toBe("INVALID_URL");
    }
  });

  it("throws for empty input", () => {
    expect(() => normalizeUrl("   ")).toThrow(ArchiveError);
  });
});

describe("validateUrl", () => {
  it("accepts bare domains", () => {
    expect(validateUrl("youtube.com")).toEqual({ ok: true, url: "https://youtube.com/" });
  });

  it("rejects non-websites with the product copy signal", () => {
    const result = validateUrl("hello world");
    expect(result.ok).toBe(false);
  });
});

describe("parseCdxResponse", () => {
  it("parses rows, drops the header, dupes, and non-200s", () => {
    const snaps = parseCdxResponse(CDX_FIXTURE);
    expect(snaps).toHaveLength(2);
    expect(snaps[0].timestamp).toBe("20050428014715");
    expect(snaps[0].year).toBe(2005);
    expect(snaps[1].year).toBe(2010);
  });

  it("returns [] for empty input", () => {
    expect(parseCdxResponse([])).toEqual([]);
  });
});

describe("snapshot URLs", () => {
  const snap = {
    timestamp: "20100101000000",
    original: "http://www.youtube.com/",
    year: 2010,
    displayDate: "Jan 1, 2010",
  };

  it("builds a replay URL", () => {
    expect(buildSnapshotUrl(snap)).toBe(
      "https://web.archive.org/web/20100101000000/http://www.youtube.com/"
    );
  });

  it("builds an iframe URL with the id_ flag (original bytes, no toolbar)", () => {
    expect(buildIframeUrl(snap)).toBe(
      "https://web.archive.org/web/20100101000000id_/http://www.youtube.com/"
    );
  });
});

describe("deriveEras", () => {
  it("derives one era per year from real snapshots only", () => {
    const snaps = parseCdxResponse(CDX_FIXTURE);
    const eras = deriveEras(snaps);
    expect(eras.map((e) => e.year)).toEqual([2005, 2010]);
    for (const era of eras) {
      expect(era.label.length).toBeGreaterThan(0);
    }
  });

  it("returns [] when there are no snapshots", () => {
    expect(deriveEras([])).toEqual([]);
  });
});
