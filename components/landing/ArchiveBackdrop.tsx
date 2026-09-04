// Visual anchor for the landing hero: a slow, quiet archive wall —
// two counter-scrolling rows of faded era-styled webpage wireframes
// ("1999" above, "2026" below), fading seamlessly into the dark
// ground at every edge. Pure CSS (two duplicated marquee tracks,
// masks, no JS), aria-hidden, pointer-events-none. The wireframes are
// deliberately abstract — evocations of design eras, not fake content
// (plan §77: serious digital museum, not cartoon illustrations).

const OLD_YEARS = ["1996", "1999", "2001", "2004", "2007", "1998", "2002", "2005"];
const NEW_YEARS = ["2016", "2019", "2021", "2023", "2026", "2018", "2022", "2024"];

function OldPageCard({ year }: { year: string }) {
  // 90s/2000s wireframe: serif wordmark, rule lines, dense text rows
  return (
    <figure className="w-44 shrink-0 rounded-sm border border-white/[0.06] bg-white/[0.02] p-3 sm:w-52">
      <figcaption className="font-mono text-[9px] tracking-[0.2em] text-amber-bright/50">
        {year}
      </figcaption>
      <div className="mt-2 h-2 w-3/4 rounded-sm bg-white/15" />
      <div className="mt-1 h-px w-full bg-white/10" />
      <div className="mt-2 space-y-1">
        {[10, 9, 11, 8, 10, 7, 11, 9, 6, 10, 8].map((w, i) => (
          <div key={i} className="h-[3px] rounded-sm bg-white/[0.07]" style={{ width: `${w * 4}%` }} />
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 w-8 rounded-sm bg-amber-bright/10" />
        ))}
      </div>
    </figure>
  );
}

function NewPageCard({ year }: { year: string }) {
  // modern wireframe: hero media block, card grid, chrome top bar
  return (
    <figure className="w-44 shrink-0 rounded-md border border-white/[0.07] bg-white/[0.02] p-2.5 sm:w-52">
      <figcaption className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-ice/50">
        <span>{year}</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-white/20" />
          ))}
        </span>
      </figcaption>
      <div className="mt-2 h-10 rounded bg-gradient-to-br from-white/[0.05] to-transparent" />
      <div className="mt-2 h-1.5 w-1/2 rounded-sm bg-white/12" />
      <div className="mt-1.5 h-1 w-2/3 rounded-sm bg-white/[0.07]" />
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-5 rounded bg-white/[0.04]" />
        ))}
      </div>
    </figure>
  );
}

function Row({
  children,
  duration,
  reverse = false,
}: {
  children: React.ReactNode;
  duration: number;
  reverse?: boolean;
}) {
  return (
    <div className="relative flex overflow-hidden">
      <div
        className="flex w-max gap-4 pr-4 animate-marquee"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

export function ArchiveBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      {/* the two eras, vertically separated like exhibits; each row
          fades out at its left/right edge via mask-image */}
      <div className="absolute inset-x-0 top-[12%] -translate-y-1/2 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <Row duration={110}>
          {OLD_YEARS.map((y) => (
            <OldPageCard key={y} year={y} />
          ))}
        </Row>
      </div>
      <div className="absolute inset-x-0 top-[62%] -translate-y-1/2 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <Row duration={130} reverse>
          {NEW_YEARS.map((y) => (
            <NewPageCard key={y} year={y} />
          ))}
        </Row>
      </div>

      {/* vertical fade into the dark ground (top and bottom edges) */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink" />
      {/* vignette: keeps the center clear for the headline */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_45%,transparent,rgba(6,6,9,0.85))]" />
    </div>
  );
}
