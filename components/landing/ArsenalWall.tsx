"use client";

// Arsenal wall (godseye-style): two opposing rows of huge words —
// outlined by default (transparent fill + 1px text stroke), filling
// solid on hover — separated by amber diamonds. Pure CSS animation
// (30s linear, duplicated content for the seamless -50% loop). The
// words mix the technical arsenal with the product's vocabulary.

export function ArsenalWall() {
  const row = (items: string[], reverse: boolean) => (
    <div
      className="relative overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        className="flex w-max items-baseline gap-8 animate-marquee-slow py-2"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="group whitespace-nowrap text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-stroke-word transition-colors duration-300 hover:text-fog"
          >
            {item}
            <span className="mx-8 text-lg text-amber-bright/50 align-middle">◆</span>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative border-b border-white/5 py-8">
      {row(
        [
          "Wayback CDX", "Deterministic", "Internet DNA", "Evolution Engine",
          "Change Detection", "Tech Fingerprints",
        ],
        false
      )}
      {row(
        [
          "Evolution Lab", "Future Simulator", "Sandboxed Viewer",
          "Fact · Inference", "Zero Paid APIs", "35 Years",
        ],
        true
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
