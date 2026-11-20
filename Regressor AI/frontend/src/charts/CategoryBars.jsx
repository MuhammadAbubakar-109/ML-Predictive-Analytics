import { compactPkr, pkr } from "../utils/format";

// Estimated salary for each choice of one field, highest first. The current choice is marked.
export default function CategoryBars({ rows, current }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((r) => r.value), 1);
  return (
    <ul className="catbars" aria-label="Estimated monthly salary for each choice">
      {sorted.map((r) => (
        <li key={r.label} className={r.label === current ? "is-current" : ""}>
          <span className="catbars-name">{r.label}{r.label === current && <em>current</em>}</span>
          <span className="catbars-track"><span style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="catbars-val" title={pkr(r.value)}>{compactPkr(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
