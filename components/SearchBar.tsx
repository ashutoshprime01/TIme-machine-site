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
      <input
        id="site-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search a website, company, product, or URL…"
        autoComplete="off"
        spellCheck={false}
        className={`flex-1 rounded-lg border border-line bg-panel text-fog placeholder:text-faint focus:border-amber-bright ${
          large ? "px-5 py-4 text-base sm:text-lg" : "px-4 py-2.5 text-sm"
        }`}
      />
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className={`rounded-lg bg-amber text-ink font-semibold hover:bg-amber-bright transition-colors disabled:opacity-50 ${
          large ? "px-6 py-4 text-base" : "px-4 py-2.5 text-sm"
        }`}
      >
        {pending ? "Searching…" : "Travel"}
      </button>
    </form>
  );
}
