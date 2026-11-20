import { metric } from "../utils/format";
import { modelColor } from "../labels";

// Horizontal bars for one metric, best first.
export default function MetricBars({ rows }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const top = sorted[0]?.value;
  return (
    <ul className="bars">
      {sorted.map((r) => (
        <li key={r.id} className={r.value === top ? "is-best" : ""}>
          <span className="bars-name"><i style={{ background: modelColor(r.id) }} />{r.name}</span>
          <span className="bars-track">
            <span className="bars-fill" style={{ width: `${Math.max(r.value, 0) * 100}%`, background: modelColor(r.id) }} />
          </span>
          <span className="bars-val">{metric(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
