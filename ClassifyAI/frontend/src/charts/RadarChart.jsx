import { modelColor } from "../labels";

const SIZE = 340;
const C = SIZE / 2;
const R = 112;

// Compares models across several metrics at once. The centre is `min`, not zero.
export default function RadarChart({ series, axes, min = 0.4, max = 1 }) {
  const n = axes.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const at = (i, v) => {
    const r = ((Math.max(v, min) - min) / (max - min)) * R;
    return [C + r * Math.cos(angle(i)), C + r * Math.sin(angle(i))];
  };
  const rings = [0.25, 0.5, 0.75, 1].map((t) => min + t * (max - min));

  return (
    <svg viewBox={`-44 0 ${SIZE + 88} ${SIZE}`} className="radar" role="img" aria-label="Radar chart comparing models">
      {rings.map((v) => (
        <polygon key={v} className="radar-ring"
          points={axes.map((_, i) => at(i, v).join(",")).join(" ")} />
      ))}
      {axes.map((a, i) => {
        const [x, y] = at(i, max);
        const [lx, ly] = [C + (R + 24) * Math.cos(angle(i)), C + (R + 24) * Math.sin(angle(i))];
        const anchor = Math.abs(lx - C) < 6 ? "middle" : lx > C ? "start" : "end";
        return (
          <g key={a.key}>
            <line x1={C} y1={C} x2={x} y2={y} className="radar-axis" />
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" className="chart-text">{a.label}</text>
          </g>
        );
      })}
      {rings.map((v) => (
        <text key={v} x={C + 4} y={C - ((v - min) / (max - min)) * R} className="chart-text radar-ring-label">{v.toFixed(2)}</text>
      ))}
      {series.map((s) => (
        <g key={s.id}>
          <polygon className="radar-shape"
            points={axes.map((a, i) => at(i, s.values[a.key]).join(",")).join(" ")}
            style={{ stroke: modelColor(s.id), fill: modelColor(s.id) }} />
          {axes.map((a, i) => {
            const [x, y] = at(i, s.values[a.key]);
            return <circle key={a.key} cx={x} cy={y} r="3" style={{ fill: modelColor(s.id) }} />;
          })}
        </g>
      ))}
    </svg>
  );
}
