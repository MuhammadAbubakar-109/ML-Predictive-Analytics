// A tiny trend line with a dot on the latest value. `values` are probabilities from 0 to 1.
export default function Sparkline({ values, width = 140, height = 36 }) {
  if (values.length < 2) return null;
  const pad = 4;
  const x = (i) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v) => pad + (1 - v) * (height - pad * 2);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <path d={d} />
      <circle cx={x(last)} cy={y(values[last])} r="3" />
    </svg>
  );
}
