import { modelColor } from "../labels";
import { compactPkr } from "../utils/format";

// Two thin bars per model, for comparing the same measurement in two situations.
export default function GroupedBars({ rows, labelA, labelB }) {
  const max = Math.max(...rows.flatMap((r) => [r.a, r.b]), 1);
  return (
    <div className="grouped">
      <div className="grouped-key" aria-hidden="true">
        <span><i className="is-a" />{labelA}</span>
        <span><i className="is-b" />{labelB}</span>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            <span className="bars-name"><i style={{ background: modelColor(r.id) }} />{r.name}</span>
            <div className="grouped-bars">
              <span className="grouped-bar is-a" style={{ width: `${(r.a / max) * 100}%` }}><b>{compactPkr(r.a)}</b></span>
              <span className="grouped-bar is-b" style={{ width: `${(r.b / max) * 100}%` }}><b>{compactPkr(r.b)}</b></span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
