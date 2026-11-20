import { modelColor } from "../labels";

const W = 480;
const H = 300;
const M = { l: 48, r: 24, t: 16, b: 44 };

// Precision against recall: shows the trade-off each model makes.
export default function ScatterChart({ points, xLabel, yLabel }) {
  const lo = (key) => Math.max(0, Math.floor((Math.min(...points.map((p) => p[key])) - 0.05) * 10) / 10);
  const hi = (key) => Math.min(1, Math.ceil((Math.max(...points.map((p) => p[key])) + 0.05) * 10) / 10);
  const [x0, x1, y0, y1] = [lo("x"), hi("x"), lo("y"), hi("y")];
  const sx = (v) => M.l + ((v - x0) / (x1 - x0)) * (W - M.l - M.r);
  const sy = (v) => M.t + (1 - (v - y0) / (y1 - y0)) * (H - M.t - M.b);
  const ticks = (a, b) => Array.from({ length: 5 }, (_, i) => a + (i * (b - a)) / 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="scatter" role="img" aria-label={`${yLabel} against ${xLabel} for each model`}>
      {ticks(y0, y1).map((v) => (
        <g key={`y${v}`}>
          <line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} className="grid-line" />
          <text x={M.l - 8} y={sy(v)} textAnchor="end" dominantBaseline="middle" className="chart-text">{v.toFixed(2)}</text>
        </g>
      ))}
      {ticks(x0, x1).map((v) => (
        <text key={`x${v}`} x={sx(v)} y={H - M.b + 18} textAnchor="middle" className="chart-text">{v.toFixed(2)}</text>
      ))}
      <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" className="chart-text chart-axis-title">{xLabel}</text>
      <text transform={`translate(12 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" className="chart-text chart-axis-title">{yLabel}</text>
      {points.map((p) => {
        const flip = sx(p.x) > W - 130;
        return (
          <g key={p.id}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r="7" style={{ fill: modelColor(p.id) }} className="scatter-dot" />
            <text x={sx(p.x) + (flip ? -12 : 12)} y={sy(p.y)} textAnchor={flip ? "end" : "start"} dominantBaseline="middle" className="chart-text chart-point-label">
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
