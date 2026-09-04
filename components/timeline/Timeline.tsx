// Horizontal year timeline (plan §9, §11) — only years with data are shown.
// Pure links: works without JavaScript, keyboard/screen-reader friendly.

import Link from "next/link";
import { captureYear } from "@/lib/security/url";
import type { Capture } from "@/lib/types";

export function Timeline({
  domain,
  captures,
  activeTimestamp,
}: {
  domain: string;
  captures: Capture[];
  activeTimestamp?: string;
}) {
  const byYear = new Map<string, Capture[]>();
  for (const c of captures) {
    const y = captureYear(c.timestamp);
    (byYear.get(y) ?? byYear.set(y, []).get(y)!).push(c);
  }
  const years = [...byYear.keys()].sort();
  const activeYear = activeTimestamp ? captureYear(activeTimestamp) : undefined;
  const maxCount = Math.max(...years.map((y) => byYear.get(y)!.length), 1);

  return (
    <nav aria-label="Capture timeline by year">
      <div
        className="flex gap-1.5 overflow-x-auto pb-3 pt-1"
        role="group"
        aria-label="Years with archived captures"
      >
        {years.map((year) => {
          const list = byYear.get(year)!;
          const isActive = year === activeYear;
          const count = list.length;
          const barHeight = 6 + Math.round((count / maxCount) * 26);
          return (
            <Link
              key={year}
              href={`/entity/${domain}/snapshot/${list[0].timestamp}`}
              aria-current={isActive ? "true" : undefined}
              title={`${count} capture${count === 1 ? "" : "s"} archived in ${year}`}
              className={`group flex min-w-14 flex-1 flex-col items-center justify-end gap-1.5 rounded-lg border px-2 pt-3 pb-2 transition-colors ${
                isActive
                  ? "border-amber bg-amber/10"
                  : "border-line-soft bg-panel hover:border-line hover:bg-raised"
              }`}
            >
              <span
                aria-hidden="true"
                className={`w-1.5 rounded-full transition-colors ${
                  isActive ? "bg-amber" : "bg-line group-hover:bg-faint"
                }`}
                style={{ height: `${barHeight}px` }}
              />
              <span
                className={`text-xs tabular-nums ${
                  isActive ? "text-amber-bright font-semibold" : "text-mist"
                }`}
              >
                {year}
              </span>
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-faint">
        Available captures are not continuous — each year links to its first
        archived snapshot. {captures.length} captures shown.
      </p>
    </nav>
  );
}
