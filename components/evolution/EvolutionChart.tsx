"use client";

// Cross-year metric chart (plan §46). Single-series SVG line chart with
// hover crosshair + tooltip, direct label on the last value, and a table
// view so the data is never color/hover-dependent. Series hue is the
// validated dark-surface amber (#c98500).

import { useMemo, useState, type MouseEvent } from "react";

export interface ChartPoint {
  year: string;
  values: Record<string, number>;
}

const SERIES: Array<{ id: string; label: string }> = [
  { id: "wordCount", label: "Words" },
  { id: "linkCount", label: "Links" },
  { id: "imageCount", label: "Images" },
  { id: "domNodes", label: "DOM elements" },
  { id: "minimalism", label: "Minimalism (DNA)" },
  { id: "informationDensity", label: "Information density (DNA)" },
  { id: "commercialization", label: "Commercialization (DNA)" },
  { id: "mobileFocus", label: "Mobile focus (DNA)" },
  { id: "mediaIntensity", label: "Media intensity (DNA)" },
];

const W = 760;
const H = 300;
const M = { top: 24, right: 60, bottom: 34, left: 54 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

function niceMax(v: number): number {
  if (v <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 5, 10]) {
    if (m * pow >= v) return m * pow;
  }
  return 10 * pow;
}

export function EvolutionChart({ points }: { points: ChartPoint[] }) {
  const [series, setSeries] = useState(SERIES[0].id);
  const [hover, setHover] = useState<number | null>(null);

  const values = useMemo(
    () => points.map((p) => p.values[series] ?? 0),
    [points, series]
  );
  const max = useMemo(() => niceMax(Math.max(...values, 1)), [values]);

  const x = (i: number) =>
    points.length === 1 ? M.left + PLOT_W / 2 : M.left + (i / (points.length - 1)) * PLOT_W;
  const y = (v: number) => M.top + PLOT_H - (v / max) * PLOT_H;

  const linePath = points
    .map((_, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(values[i]).toFixed(1)}`)
    .join(" ");

  // Thin x labels to at most ~12 for readability.
  const labelEvery = Math.max(1, Math.ceil(points.length / 12));

  function onMove(e: MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const svgX = frac * W;
    const idx = Math.round(((svgX - M.left) / PLOT_W) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, idx)));
  }

  const activeLabel = SERIES.find((s) => s.id === series)!;
  const hoverPoint = hover !== null ? points[hover] : null;
  const hoverValue = hover !== null ? values[hover] : 0;
  const last = points.length - 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="chart-series" className="text-sm text-mist">
          Metric
        </label>
        <select
          id="chart-series"
          value={series}
          onChange={(e) => setSeries(e.target.value)}
          className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-sm text-fog"
        >
          {SERIES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-faint">{points.length} yearly samples</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${activeLabel.label} of the website per year, from ${points[0]?.year} to ${points[last]?.year}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* horizontal gridlines + y labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const gy = M.top + PLOT_H * (1 - f);
          return (
            <g key={f}>
              <line x1={M.left} x2={W - M.right} y1={gy} y2={gy} stroke="#26263a" strokeWidth="1" />
              <text x={M.left - 8} y={gy + 4} textAnchor="end" fontSize="11" fill="#6c6c86">
                {Math.round(max * f).toLocaleString("en-US")}
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === last ? (
            <text
              key={p.year}
              x={x(i)}
              y={H - M.bottom + 18}
              textAnchor="middle"
              fontSize="11"
              fill="#6c6c86"
            >
              {p.year}
            </text>
          ) : null
        )}

        {/* the series line */}
        <path d={linePath} fill="none" stroke="#c98500" strokeWidth="2" strokeLinejoin="round" />

        {/* direct label on the last value */}
        {points.length > 0 && (
          <text
            x={x(last) + 8}
            y={y(values[last]) + 4}
            fontSize="12"
            fill="#e9e9f2"
          >
            {values[last].toLocaleString("en-US")}
          </text>
        )}

        {/* hover layer: crosshair, marker, tooltip */}
        {hover !== null && hoverPoint && (
          <g pointerEvents="none">
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={M.top}
              y2={M.top + PLOT_H}
              stroke="#6c6c86"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={x(hover)} cy={y(hoverValue)} r="4" fill="#c98500" stroke="#12121a" strokeWidth="2" />
            <g
              transform={`translate(${Math.min(Math.max(x(hover) - 60, M.left), W - M.right - 120)}, ${Math.max(y(hoverValue) - 44, M.top)})`}
            >
              <rect width="120" height="34" rx="6" fill="#191926" stroke="#26263a" />
              <text x="60" y="14" textAnchor="middle" fontSize="11" fill="#a0a0b8">
                {hoverPoint.year}
              </text>
              <text x="60" y="27" textAnchor="middle" fontSize="12" fill="#e9e9f2">
                {hoverValue.toLocaleString("en-US")}
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* table view (data never depends on the chart) */}
      <details className="text-sm">
        <summary className="cursor-pointer text-mist hover:text-fog">Data table</summary>
        <table className="mt-2 w-full max-w-md text-left tabular-nums">
          <thead>
            <tr className="text-xs text-faint">
              <th scope="col" className="py-1 pr-4 font-medium">Year</th>
              <th scope="col" className="py-1 font-medium">{activeLabel.label}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.year} className="border-t border-line-soft">
                <td className="py-1 pr-4 text-mist">{p.year}</td>
                <td className="py-1 text-fog">{values[i].toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
