"use client";

import type { Snapshot } from "@/lib/archive/wayback";

export function Timeline({
  snapshots,
  selected,
  onSelect,
}: {
  snapshots: Snapshot[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const current = snapshots[selected] ?? snapshots[0];

  return (
    <section aria-label="Archive timeline" className="border border-line">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-5 py-6 md:px-8">
        <div>
          <p className="catalog text-[11px] text-dim">Strata — drag through time</p>
          <p
            aria-live="polite"
            className="mt-2 font-display text-5xl font-light text-bone md:text-6xl"
          >
            {current.year}
          </p>
        </div>
        <p className="font-catalog text-[11px] tracking-wide text-faded">
          {current.displayDate} · capture {selected + 1} of {snapshots.length}
        </p>
      </div>

      <div className="px-5 py-6 md:px-8">
        <label htmlFor="strata-scrub" className="sr-only">
          Scrub through archived captures
        </label>
        <input
          id="strata-scrub"
          type="range"
          min={0}
          max={snapshots.length - 1}
          step={1}
          value={selected}
          onChange={(e) => onSelect(Number(e.target.value))}
          aria-valuetext={`${current.year}, captured ${current.displayDate}`}
          className="strata"
        />
        <div
          role="group"
          aria-label="Snapshots by year"
          className="mt-2 flex flex-wrap gap-x-1 gap-y-2"
        >
          {snapshots.map((snap, i) => {
            const active = i === selected;
            return (
              <button
                key={snap.timestamp}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`View capture from ${snap.displayDate}`}
                aria-current={active ? "true" : undefined}
                title={snap.displayDate}
                className={`pressable min-h-11 min-w-11 px-2 py-2 font-catalog text-[11px] tracking-wide ${
                  active
                    ? "bg-ochre text-ink"
                    : "text-faded hover:bg-ink-soft hover:text-bone"
                }`}
              >
                {snap.year}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
