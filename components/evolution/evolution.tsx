import { deriveEras, type Snapshot } from "@/lib/archive/wayback";

export function Evolution({ snapshots }: { snapshots: Snapshot[] }) {
  const eras = deriveEras(snapshots);
  return (
    <section aria-label="Website evolution" className="border border-line">
      <div className="border-b border-line px-5 py-6 md:px-8">
        <p className="catalog text-[11px] text-dim">03 — Website evolution</p>
        <h2 className="mt-3 font-display text-3xl font-light text-bone md:text-4xl">
          The record, year by year.
        </h2>
      </div>
      <ol>
        {eras.map((era) => (
          <li
            key={era.year}
            className="grid gap-1 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[120px_1fr_auto] md:items-baseline md:px-8"
          >
            <p className="font-display text-2xl font-light text-bone">{era.year}</p>
            <p className="text-sm text-faded">{era.label}</p>
            <p className="font-catalog text-[11px] tracking-wide text-dim">
              first capture {era.firstCapture}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
