import { useState } from "react";
import { compactPkr, niceRange, pkr } from "../utils/format";

const W = 380;
const H = 250;
const M = { l: 50, r: 14, t: 14, b: 40 };

// Salary (PKR) on the vertical axis, one input value on the horizontal axis.
export default function LineChart({ points, formatX = String, xLabel, marker }) {
  const [hover, setHover] = useState(null);
  if (!points.length) return null;

  const xs = points.map((p) => p.x);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const ys = points.map((p) => p.y);
  const [yMin, yMax] = niceRange(Math.min(...ys), Math.max(...ys));
  const sx = (x) => M.l + ((x - xMin) / (xMax - xMin || 1)) * (W - M.l - M.r);
  const sy = (y) => M.t + (1 - (y - yMin) / (yMax - yMin || 1)) * (H - M.t - M.b);

  const line = points.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ");
  const area = `${line} L${sx(xMax).toFixed(1)} ${sy(yMin)} L${sx(xMin).toFixed(1)} ${sy(yMin)} Z`;
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => xMin + t * (xMax - xMin));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * (yMax - yMin));

  function onMove(e) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    points.forEach((p, i) => { if (Math.abs(sx(p.x) - px) < Math.abs(sx(points[best].x) - px)) best = i; });
    setHover(best);
  }

  const h = hover != null ? points[hover] : null;
  const tipLeft = h && sx(h.x) > W * 0.6;
  const tipY = h ? Math.max(sy(h.y) - 34, M.t) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="linechart" role="img" aria-label={`Estimated monthly salary as ${xLabel} changes`}>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} className="grid-line" />
          <text x={M.l - 8} y={sy(v)} textAnchor="end" dominantBaseline="middle" className="chart-text">{compactPkr(v)}</text>
        </g>
      ))}
      {xTicks.map((v, i) => (
        <text key={i} x={sx(v)} y={H - M.b + 18} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"} className="chart-text">{formatX(v)}</text>
      ))}
      <text x={(M.l + W - M.r) / 2} y={H - 4} textAnchor="middle" className="chart-text chart-axis-title">{xLabel}</text>

      <path d={area} className="line-area" />
      <path d={line} className="line-stroke" />
      {points.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={hover === i ? 5 : 3.2} className="line-dot" />)}

      {marker != null && marker >= xMin && marker <= xMax && (
        <g>
          <line x1={sx(marker)} x2={sx(marker)} y1={M.t} y2={H - M.b} className="line-marker" />
          <text x={sx(marker)} y={M.t + 10} textAnchor={sx(marker) > W * 0.8 ? "end" : "start"} dx={sx(marker) > W * 0.8 ? -6 : 6} className="chart-text chart-now">current</text>
        </g>
      )}

      {h && (
        <g pointerEvents="none">
          <rect x={tipLeft ? sx(h.x) - 124 : sx(h.x) + 10} y={tipY} width="114" height="40" rx="8" className="chart-tip" />
          <text x={tipLeft ? sx(h.x) - 114 : sx(h.x) + 20} y={tipY + 16} className="chart-tip-text">{formatX(h.x)}</text>
          <text x={tipLeft ? sx(h.x) - 114 : sx(h.x) + 20} y={tipY + 32} className="chart-tip-text is-strong">{pkr(h.y)}</text>
        </g>
      )}

      <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
    </svg>
  );
}
