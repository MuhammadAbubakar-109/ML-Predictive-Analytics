import { modelColor } from "../labels";

// Horizontal bars for one metric. `better` says whether a higher ("max") or lower ("min") value wins.
export default function MetricBars({ rows, better = "max", format, fullScale }) {
  const values = rows.map((r) => r.value);
  const bestValue = better === "max" ? Math.max(...values) : Math.min(...values);
  const scaleMax = fullScale ?? Math.max(...values, 1e-9);
  const sorted = [...rows].sort((a, b) => (better === "max" ? b.value - a.value : a.value - b.value));

  return (
    <ul className="bars">
      {sorted.map((r) => (
        <li key={r.id} className={r.value === bestValue ? "is-best" : ""}>
          <span className="bars-name"><i style={{ background: modelColor(r.id) }} />{r.name}</span>
          <span className="bars-track">
            <span className="bars-fill" style={{ width: `${(Math.max(r.value, 0) / scaleMax) * 100}%`, background: modelColor(r.id) }} />
          </span>
          <span className="bars-val">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
