"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { validateUrl } from "@/lib/archive/wayback";

export function UrlForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateUrl(value);
    if (!result.ok) {
      setError("That doesn't look like a website.");
      return;
    }
    setError(null);
    router.push(`/explore?url=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={submit} noValidate>
      <div
        className={`flex flex-col gap-3 border p-3 transition-colors sm:flex-row sm:items-center ${
          error ? "border-ochre" : "border-line-strong focus-within:border-ochre"
        }`}
      >
        <label htmlFor="site-url" className="sr-only">
          Enter a website address
        </label>
        <input
          id="site-url"
          name="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          placeholder="Enter a website..."
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "url-error" : undefined}
          className="w-full bg-transparent px-3 py-3 font-catalog text-sm tracking-wide text-bone placeholder:text-dim focus:outline-none"
        />
        <button
          type="submit"
          className="pressable catalog shrink-0 bg-bone px-8 py-3 text-xs font-medium text-ink hover:bg-ochre"
        >
          Explore
        </button>
      </div>
      <p id="url-error" role="alert" aria-live="polite" className="min-h-6 pt-2">
        {error && (
          <span className="catalog text-[11px] text-ochre">
            That doesn&rsquo;t look like a website.
          </span>
        )}
      </p>
    </form>
  );
}
