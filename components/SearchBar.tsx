"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

export function SearchBar({
  initialValue = "",
  size = "large",
}: {
  initialValue?: string;
  size?: "large" | "compact";
}) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    startTransition(() => router.push(`/search?q=${encodeURIComponent(q)}`));
  }

  const large = size === "large";

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={`flex w-full gap-2 ${large ? "max-w-2xl mx-auto" : "max-w-md"}`}
    >
      <label htmlFor="site-search" className="sr-only">
        Search a website, company, product, or URL
      </label>
      <div
        className={`group relative flex-1 rounded-xl border border-white/15 bg-ink/70 backdrop-blur-xl transition-all duration-300 focus-within:border-amber-bright/60 focus-within:bg-ink/85 focus-within:shadow-[0_0_0_1px_rgba(232,180,90,0.35),0_0_44px_-8px_rgba(232,180,90,0.45)] ${
          large ? "" : "text-sm"
        }`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 font-mono text-faint text-sm tracking-wider group-focus-within:text-amber-bright transition-colors"
        >
          ⇢
        </span>
        <input
          id="site-search"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a website, company, product, or URL…"
          autoComplete="off"
          spellCheck={false}
          className={`w-full bg-transparent text-fog placeholder:text-faint outline-none ${
            large
              ? "pl-10 sm:pl-11 pr-4 py-4 text-base sm:text-lg"
              : "pl-9 pr-3 py-2.5 text-sm"
          }`}
        />
      </div>
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className={`btn-primary font-mono tracking-wider uppercase disabled:opacity-50 disabled:shadow-none ${
          large ? "px-7 py-4 text-sm" : "px-5 py-2.5 text-xs"
        }`}
      >
        {pending ? "…" : "Travel"}
      </button>
    </form>
  );
}
