import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-dim md:flex-row md:items-center md:justify-between md:px-8">
        <p className="catalog text-[11px]">
          Digital Archaeologist — a time machine for the web
        </p>
        <p>
          Snapshots courtesy of the{" "}
          <a
            href="https://archive.org"
            target="_blank"
            rel="noreferrer"
            className="text-faded underline decoration-line-strong underline-offset-4 hover:text-bone"
          >
            Internet Archive
          </a>
          .{" "}
          <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="text-faded underline decoration-line-strong underline-offset-4 hover:text-bone"
          >
            Source
          </a>
        </p>
      </div>
    </footer>
  );
}
