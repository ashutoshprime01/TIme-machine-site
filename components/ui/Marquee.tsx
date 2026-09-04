// Infinite marquee ticker (decorative). Duplicated content lets the strip
// translate -50% and loop seamlessly. aria-hidden on the clone.

export function Marquee({
  items,
  reverse = false,
  className = "",
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <div
        className="flex w-max gap-10 animate-marquee"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="font-mono text-xs sm:text-sm uppercase tracking-[0.3em] whitespace-nowrap flex items-center gap-10"
          >
            {item}
            <span className="text-amber-bright/60">◆</span>
          </span>
        ))}
      </div>
      {/* edge fades so the loop dissolves instead of cutting */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
