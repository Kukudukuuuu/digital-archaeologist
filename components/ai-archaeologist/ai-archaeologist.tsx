export function AiArchaeologist() {
  return (
    <section
      aria-label="AI archaeologist (unavailable — no provider configured)"
      className="border border-dashed border-line-strong"
    >
      <div className="px-5 py-6 md:px-8">
        <p className="catalog text-[11px] text-dim">04 — AI archaeologist</p>
        <h2 className="mt-3 font-display text-3xl font-light text-bone md:text-4xl">
          What changed?
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-faded">
          Era-to-era analysis will live here once an AI provider is configured —
          for example, what changed between two captures and when the big
          redesigns happened. Until then, this panel stays empty rather than
          guessing.
        </p>
        <p className="catalog mt-5 inline-block border border-line px-3 py-2 text-[10px] text-dim">
          No provider configured
        </p>
      </div>
    </section>
  );
}
