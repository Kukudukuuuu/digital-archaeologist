"use client";

import { useState } from "react";
import {
  buildIframeUrl,
  buildSnapshotUrl,
  type Snapshot,
} from "@/lib/archive/wayback";

export function ArchiveViewer({ snapshot }: { snapshot: Snapshot }) {
  // Note: the parent remounts this component (key = snapshot timestamp),
  // so `settled` always starts false for a new snapshot — no reset effect.
  const [frameKey, setFrameKey] = useState(0);
  const [settled, setSettled] = useState(false);
  const iframeUrl = buildIframeUrl(snapshot);
  const replayUrl = buildSnapshotUrl(snapshot);

  return (
    <figure className="border border-line-strong">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-soft px-4 py-3">
        <div className="flex items-center gap-2" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full border border-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full border border-line-strong" />
          <button
            type="button"
            onClick={() => setFrameKey((k) => k + 1)}
            aria-label="Reload archived page"
            title="Reload archived page"
            className="pressable flex h-6 w-6 items-center justify-center rounded-full text-faded hover:text-ochre"
          >
            ↻
          </button>
        </div>
        <p className="min-w-0 flex-1 truncate text-center font-catalog text-[11px] tracking-wide text-faded">
          {snapshot.original}
        </p>
        <span className="catalog hidden shrink-0 bg-ochre px-2 py-1 text-[10px] font-medium text-ink sm:inline">
          {snapshot.year}
        </span>
      </div>

      {/* Viewport */}
      <div className="relative bg-bone">
        {!settled && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink">
            <p className="catalog animate-pulse text-[11px] text-faded motion-reduce:animate-none">
              Excavating the web...
            </p>
          </div>
        )}
        <iframe
          key={`${snapshot.timestamp}-${frameKey}`}
          src={iframeUrl}
          title={`Archived version of ${snapshot.original} from ${snapshot.displayDate}`}
          sandbox="allow-same-origin allow-scripts allow-forms"
          loading="lazy"
          onLoad={() => setSettled(true)}
          className={`h-105 w-full border-0 bg-white md:h-150 ${
            settled ? "snapshot-settled" : "snapshot-enter"
          }`}
        />
      </div>

      {/* Caption */}
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
        <p className="font-catalog text-[11px] tracking-wide text-faded">
          Captured <time dateTime={snapshot.timestamp}>{snapshot.displayDate}</time>
        </p>
        <a
          href={replayUrl}
          target="_blank"
          rel="noreferrer"
          className="pressable font-catalog text-[11px] tracking-wide text-faded underline decoration-line-strong underline-offset-4 hover:text-ochre"
        >
          Open on web.archive.org ↗
        </a>
      </figcaption>
    </figure>
  );
}
