"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArchiveViewer } from "@/components/archive-viewer/archive-viewer";
import { ArchiveState, type ArchiveStateKind } from "@/components/ui/archive-state";
import { validateUrl, type Snapshot } from "@/lib/archive/wayback";

type Status =
  | { phase: "missing" }
  | { phase: "loading" }
  | { phase: "error"; kind: Exclude<ArchiveStateKind, "loading"> }
  | { phase: "ready"; snapshots: Snapshot[]; partial: boolean };

const CODE_TO_KIND: Record<string, Exclude<ArchiveStateKind, "loading">> = {
  INVALID_URL: "invalid",
  NO_SNAPSHOTS: "empty",
  RATE_LIMITED: "rate-limited",
  UPSTREAM_ERROR: "upstream",
};

export function Explorer() {
  const params = useSearchParams();
  const rawUrl = (params.get("url") ?? "").trim();
  const [status, setStatus] = useState<Status>({ phase: "missing" });
  const [selected, setSelected] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!rawUrl) {
      setStatus({ phase: "missing" });
      return;
    }
    if (!validateUrl(rawUrl).ok) {
      setStatus({ phase: "error", kind: "invalid" });
      return;
    }
    let cancelled = false;
    setStatus({ phase: "loading" });
    fetch(`/api/snapshots?url=${encodeURIComponent(rawUrl)}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          snapshots?: Snapshot[];
          partial?: boolean;
          code?: string;
        };
        if (cancelled) return;
        if (res.ok && data.snapshots) {
          setSelected(data.snapshots.length - 1);
          setStatus({
            phase: "ready",
            snapshots: data.snapshots,
            partial: data.partial ?? false,
          });
        } else {
          setStatus({
            phase: "error",
            kind: CODE_TO_KIND[data.code ?? ""] ?? "upstream",
          });
        }
      })
      .catch(() => {
        if (!cancelled) setStatus({ phase: "error", kind: "upstream" });
      });
    return () => {
      cancelled = true;
    };
  }, [rawUrl, attempt]);

  if (status.phase === "missing") {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <ArchiveState kind="invalid" />
      </div>
    );
  }
  if (status.phase === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <p className="catalog text-[11px] text-dim">Excavating {rawUrl}</p>
        <div className="mt-6">
          <ArchiveState kind="loading" />
        </div>
      </div>
    );
  }
  if (status.phase === "error") {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        {status.kind === "invalid" && (
          <p className="catalog mb-6 text-[11px] text-dim">Excavating {rawUrl}</p>
        )}
        <ArchiveState
          kind={status.kind}
          action={
            status.kind === "rate-limited" || status.kind === "upstream" ? (
              <button
                type="button"
                onClick={() => setAttempt((a) => a + 1)}
                className="pressable catalog border border-line-strong px-6 py-3 text-xs text-bone hover:border-ochre hover:text-ochre"
              >
                Try again
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const { snapshots, partial } = status;
  const current = snapshots[selected] ?? snapshots[0];
  const host = (() => {
    try {
      return new URL(current.original).hostname.replace(/^www\./, "");
    } catch {
      return rawUrl;
    }
  })();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <p className="catalog text-[11px] text-ochre">The history of this website</p>
      <h1 className="mt-4 font-display text-4xl font-light tracking-tight text-bone md:text-6xl">
        {host}
      </h1>
      <p className="mt-4 font-catalog text-[11px] tracking-wide text-dim">
        {snapshots.length} captures · {snapshots[0].year}–
        {snapshots[snapshots.length - 1].year}
        {partial ? " · partial record" : ""}
      </p>

      <div className="mt-10">
        <ArchiveViewer key={current.timestamp} snapshot={current} />
      </div>

      {/* Timeline (Task 7) and comparison/evolution/AI (Task 8) mount here. */}
      <div className="mt-10 border border-dashed border-line p-6">
        <p className="catalog text-[11px] text-dim">
          Timeline · comparison · evolution — arriving next. Currently viewing the
          most recent capture ({current.displayDate}).
          <span className="sr-only">
            Snapshot {selected + 1} of {snapshots.length}.
          </span>
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={selected <= 0}
            onClick={() => setSelected((i) => Math.max(0, i - 1))}
            className="pressable catalog border border-line-strong px-4 py-2 text-[11px] text-bone hover:border-ochre disabled:opacity-30"
          >
            ← Older
          </button>
          <button
            type="button"
            disabled={selected >= snapshots.length - 1}
            onClick={() => setSelected((i) => Math.min(snapshots.length - 1, i + 1))}
            className="pressable catalog border border-line-strong px-4 py-2 text-[11px] text-bone hover:border-ochre disabled:opacity-30"
          >
            Newer →
          </button>
        </div>
      </div>
    </div>
  );
}
