import { modelColor } from "../labels";
import { niceRange } from "../utils/format";

const W = 480;
const H = 300;
const M = { l: 56, r: 24, t: 16, b: 44 };

// Each model is one dot. `formatX` / `formatY` turn numbers into axis labels.
export default function ScatterChart({ points, xLabel, yLabel, formatX, formatY }) {
  const [x0, x1] = niceRange(Math.min(...points.map((p) => p.x)), Math.max(...points.map((p) => p.x)));
  const [y0, y1] = niceRange(Math.min(...points.map((p) => p.y)), Math.max(...points.map((p) => p.y)));
  const sx = (v) => M.l + ((v - x0) / (x1 - x0)) * (W - M.l - M.r);
  const sy = (v) => M.t + (1 - (v - y0) / (y1 - y0)) * (H - M.t - M.b);
  const ticks = (a, b) => Array.from({ length: 5 }, (_, i) => a + (i * (b - a)) / 4);

  // Labels of nearby dots are nudged apart so they stay readable.
  const labelled = [];
  [...points]
    .map((p) => ({ ...p, px: sx(p.x), py: sy(p.y) }))
    .sort((a, b) => a.py - b.py)
    .forEach((p) => {
      let labelY = p.py;
      for (const q of labelled) {
        if (Math.abs(q.px - p.px) < 150 && Math.abs(q.labelY - labelY) < 15) labelY = q.labelY + 15;
      }
      labelled.push({ ...p, labelY, flip: p.px > W - 130 });
    });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="scatter" role="img" aria-label={`${yLabel} against ${xLabel} for each model`}>
      {ticks(y0, y1).map((v) => (
        <g key={`y${v}`}>
          <line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} className="grid-line" />
          <text x={M.l - 8} y={sy(v)} textAnchor="end" dominantBaseline="middle" className="chart-text">{formatY(v)}</text>
        </g>
      ))}
      {ticks(x0, x1).map((v) => (
        <text key={`x${v}`} x={sx(v)} y={H - M.b + 18} textAnchor="middle" className="chart-text">{formatX(v)}</text>
      ))}
      <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" className="chart-text chart-axis-title">{xLabel}</text>
      <text transform={`translate(12 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" className="chart-text chart-axis-title">{yLabel}</text>
      {labelled.map((p) => (
        <g key={p.id}>
          <circle cx={p.px} cy={p.py} r="7" style={{ fill: modelColor(p.id) }} className="scatter-dot" />
          <text x={p.px + (p.flip ? -12 : 12)} y={p.labelY} textAnchor={p.flip ? "end" : "start"} dominantBaseline="middle" className="chart-text chart-point-label">{p.name}</text>
        </g>
      ))}
    </svg>
  );
}
