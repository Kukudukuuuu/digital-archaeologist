"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AiArchaeologist } from "@/components/ai-archaeologist/ai-archaeologist";
import { ArchiveViewer } from "@/components/archive-viewer/archive-viewer";
import { Comparison } from "@/components/comparison/comparison";
import { Evolution } from "@/components/evolution/evolution";
import { Timeline } from "@/components/timeline/timeline";
import { ArchiveState, type ArchiveStateKind } from "@/components/ui/archive-state";
import { validateUrl, type Snapshot } from "@/lib/archive/wayback";

type ViewStatus =
  | { phase: "loading" }
  | { phase: "error"; kind: Exclude<ArchiveStateKind, "loading"> }
  | { phase: "ready"; snapshots: Snapshot[]; partial: boolean };

const CODE_TO_KIND: Record<string, Exclude<ArchiveStateKind, "loading">> = {
  INVALID_URL: "invalid",
  NO_SNAPSHOTS: "empty",
  RATE_LIMITED: "rate-limited",
  UPSTREAM_ERROR: "upstream",
};

function ExplorerView({ rawUrl, onRetry }: { rawUrl: string; onRetry: () => void }) {
  const [status, setStatus] = useState<ViewStatus>({ phase: "loading" });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    let cancelled = false;
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
  }, [rawUrl]);

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
        <ArchiveState
          kind={status.kind}
          action={
            status.kind === "rate-limited" || status.kind === "upstream" ? (
              <button
                type="button"
                onClick={onRetry}
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

      <div className="mt-6">
        <Timeline snapshots={snapshots} selected={selected} onSelect={setSelected} />
      </div>

      <div className="mt-6">
        <Comparison snapshots={snapshots} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Evolution snapshots={snapshots} />
        <AiArchaeologist />
      </div>
    </div>
  );
}

export function Explorer() {
  const params = useSearchParams();
  const rawUrl = (params.get("url") ?? "").trim();
  const [attempt, setAttempt] = useState(0);

  if (!rawUrl || !validateUrl(rawUrl).ok) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        {rawUrl ? (
          <p className="catalog mb-6 text-[11px] text-dim">Excavating {rawUrl}</p>
        ) : null}
        <ArchiveState kind="invalid" />
      </div>
    );
  }

  return (
    <ExplorerView
      key={`${rawUrl}-${attempt}`}
      rawUrl={rawUrl}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  );
}
