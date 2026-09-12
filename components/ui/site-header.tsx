import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="pressable leading-none" aria-label="Digital Archaeologist home">
          <span className="catalog block text-[13px] font-medium text-bone">Digital</span>
          <span className="catalog block text-[13px] font-medium text-faded">
            Archaeologist
          </span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-6 md:gap-9">
            <li>
              <Link
                href="/"
                className="pressable catalog text-xs text-faded transition-colors hover:text-bone"
              >
                Explore
              </Link>
            </li>
            <li>
              <Link
                href="/#about"
                className="pressable catalog hidden text-xs text-faded transition-colors hover:text-bone sm:inline"
              >
                About
              </Link>
            </li>
            <li>
              <a
                href={SITE.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="pressable catalog text-xs text-faded transition-colors hover:text-bone"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
