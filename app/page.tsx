import Link from "next/link";
import { UrlForm } from "@/components/hero/url-form";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
          <p className="catalog text-[11px] text-ochre">
            Field notes on the history of the web — N° 001
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-light leading-[1.02] tracking-tight text-bone md:text-8xl">
            Explore the
            <br />
            history of the web.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-faded md:text-lg">
            Travel through archived versions of websites and discover how the
            internet changed over time.
          </p>
          <div className="mt-10 max-w-2xl">
            <UrlForm />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="catalog text-[11px] text-dim">Try:</span>
            {SITE.presets.map((preset) => (
              <Link
                key={preset}
                href={`/explore?url=${encodeURIComponent(preset)}`}
                className="pressable font-catalog text-xs tracking-wide text-faded underline decoration-line-strong underline-offset-4 hover:text-ochre"
              >
                {preset}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-px px-5 py-14 md:grid-cols-3 md:px-8">
          {[
            {
              n: "01",
              title: "Enter a website",
              body: "Any address you remember — or never knew. We look it up in the Internet Archive's Wayback Machine.",
            },
            {
              n: "02",
              title: "Scrub the timeline",
              body: "Every marker is a real archived capture. Drag through the years and watch the page change.",
            },
            {
              n: "03",
              title: "Compare eras",
              body: "Put two moments side by side and see exactly what survived — and what didn't.",
            },
          ].map((step) => (
            <article key={step.n} className="border-t border-line-strong pt-5 md:mr-8">
              <p className="catalog text-[11px] text-ochre">{step.n}</p>
              <h2 className="mt-3 font-display text-2xl font-light text-bone">
                {step.title}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-faded">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="catalog text-[11px] text-dim">About this excavation</p>
          <div className="mt-6 grid gap-10 md:grid-cols-2">
            <p className="font-display text-2xl font-light leading-snug text-bone md:text-3xl">
              The web forgets itself daily. Pages are redesigned, deleted, and
              overwritten — Digital Archaeologist digs up what the archive kept.
            </p>
            <div className="space-y-4 text-sm leading-relaxed text-faded">
              <p>
                Every snapshot shown here is a genuine capture from the Internet
                Archive, rendered exactly as it was preserved. Nothing is
                reconstructed, upscaled, or imagined.
              </p>
              <p>
                When a year is missing, it means no capture exists — the record
                is honest about its own gaps.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
