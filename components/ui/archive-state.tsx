import Link from "next/link";

export type ArchiveStateKind =
  | "loading"
  | "invalid"
  | "empty"
  | "rate-limited"
  | "upstream";

const COPY: Record<ArchiveStateKind, { title: string; body: string }> = {
  loading: {
    title: "Excavating the web...",
    body: "Querying the Internet Archive for every capture of this site. Deep histories can take a minute.",
  },
  invalid: {
    title: "That doesn't look like a website.",
    body: "Check the address and try again — a bare domain like youtube.com works best.",
  },
  empty: {
    title: "No historical layers found.",
    body: "We couldn't find an archived version of this website.",
  },
  "rate-limited": {
    title: "The archive is rate-limiting requests.",
    body: "The Wayback Machine asked us to slow down. Try again in a moment.",
  },
  upstream: {
    title: "The archive is temporarily unavailable.",
    body: "Try again in a moment.",
  },
};

export function ArchiveState({
  kind,
  action,
}: {
  kind: ArchiveStateKind;
  action?: React.ReactNode;
}) {
  const copy = COPY[kind];
  return (
    <div
      role={kind === "loading" ? "status" : "alert"}
      className="flex min-h-105 flex-col items-start justify-center border border-line px-6 py-16 md:px-12"
    >
      {kind === "loading" && (
        <span aria-hidden className="mb-6 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-2 w-2 rounded-full bg-ochre motion-safe:animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </span>
      )}
      <p className="catalog text-[11px] text-ochre">
        {kind === "loading" ? "Excavation in progress" : "Excavation stalled"}
      </p>
      <h2 className="mt-4 max-w-xl font-display text-3xl font-light text-bone md:text-4xl">
        {copy.title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-faded">{copy.body}</p>
      <div className="mt-8">
        {action ?? (
          <Link
            href="/"
            className="pressable catalog inline-block border border-line-strong px-6 py-3 text-xs text-bone hover:border-ochre hover:text-ochre"
          >
            Try another site
          </Link>
        )}
      </div>
    </div>
  );
}
