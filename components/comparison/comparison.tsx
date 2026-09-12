"use client";

import { useCallback, useRef, useState } from "react";
import { buildIframeUrl, type Snapshot } from "@/lib/archive/wayback";

function Pane({
  snapshot,
  snapshots,
  index,
  onStep,
  label,
}: {
  snapshot: Snapshot;
  snapshots: Snapshot[];
  index: number;
  onStep: (dir: 1 | -1) => void;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col border border-line-strong">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-ink-soft px-4 py-3">
        <span className="catalog bg-ochre px-2 py-1 text-[10px] font-medium text-ink">
          {snapshot.year}
        </span>
        <p className="min-w-0 flex-1 truncate text-center font-catalog text-[11px] text-faded">
          {label} · {snapshot.displayDate}
        </p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onStep(-1)}
            disabled={index <= 0}
            aria-label={`Show older capture in ${label} pane`}
            className="pressable px-2 py-1 font-catalog text-xs text-faded hover:text-ochre disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            disabled={index >= snapshots.length - 1}
            aria-label={`Show newer capture in ${label} pane`}
            className="pressable px-2 py-1 font-catalog text-xs text-faded hover:text-ochre disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
      <iframe
        key={snapshot.timestamp}
        src={buildIframeUrl(snapshot)}
        title={`${label} pane: archived version from ${snapshot.displayDate}`}
        sandbox="allow-same-origin allow-scripts allow-forms"
        loading="lazy"
        className="h-90 w-full border-0 bg-white md:h-120"
      />
    </div>
  );
}

export function Comparison({ snapshots }: { snapshots: Snapshot[] }) {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(snapshots.length - 1);
  const [split, setSplit] = useState(50);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const step = useCallback(
    (side: "left" | "right", dir: 1 | -1) => {
      if (side === "left") setLeft((i) => Math.min(snapshots.length - 1, Math.max(0, i + dir)));
      else setRight((i) => Math.min(snapshots.length - 1, Math.max(0, i + dir)));
    },
    [snapshots.length]
  );

  const pctFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(80, Math.max(20, Math.round(pct))));
  }, []);

  return (
    <section aria-label="Before and after comparison" className="border border-line">
      <div className="border-b border-line px-5 py-6 md:px-8">
        <p className="catalog text-[11px] text-dim">02 — Before / after</p>
        <h2 className="mt-3 font-display text-3xl font-light text-bone md:text-4xl">
          Two moments, side by side.
        </h2>
      </div>
      <div className="px-5 py-6 md:px-8">
        {/* Desktop: draggable split. Mobile: stacked. */}
        <div ref={trackRef} className="flex flex-col gap-4 md:flex-row md:gap-0">
          <div style={{ flexBasis: `${split}%` }} className="min-w-0 md:pr-2">
            <Pane
              snapshot={snapshots[left] ?? snapshots[0]}
              snapshots={snapshots}
              index={left}
              onStep={(d) => step("left", d)}
              label="Then"
            />
          </div>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Comparison divider"
            aria-valuenow={split}
            aria-valuemin={20}
            aria-valuemax={80}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setSplit((s) => Math.max(20, s - 4));
              if (e.key === "ArrowRight") setSplit((s) => Math.min(80, s + 4));
            }}
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (dragging.current) pctFromClientX(e.clientX);
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
            className="compare-handle relative hidden w-8 cursor-ew-resize touch-none items-stretch justify-center self-stretch py-1 md:flex"
          >
            <span aria-hidden className="w-px bg-line-strong" />
            <span
              aria-hidden
              className="absolute self-center border border-line-strong bg-ink px-1 font-catalog text-[10px] text-faded"
            >
              ↔
            </span>
          </div>
          <div style={{ flexBasis: `${100 - split}%` }} className="min-w-0 md:pl-2">
            <Pane
              snapshot={snapshots[right] ?? snapshots[snapshots.length - 1]}
              snapshots={snapshots}
              index={right}
              onStep={(d) => step("right", d)}
              label="Now"
            />
          </div>
        </div>
        <p className="mt-4 hidden font-catalog text-[11px] tracking-wide text-dim md:block">
          Drag the divider — or focus it and use ← → keys.
        </p>
      </div>
    </section>
  );
}
