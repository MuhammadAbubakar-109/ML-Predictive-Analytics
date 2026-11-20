import { modelColor } from "../labels";
import { compactPkr, niceRange, pkr } from "../utils/format";

// One dot per model on a shared salary axis, so disagreement is visible at a glance.
export default function SalaryStrip({ rows }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const values = rows.map((r) => r.value);
  const [lo, hi] = niceRange(Math.min(...values), Math.max(...values));
  const at = (v) => ((v - lo) / (hi - lo || 1)) * 100;

  return (
    <div className="strip" role="list" aria-label="Estimated monthly salary by model">
      <div className="strip-axis" aria-hidden="true">
        <span />
        <div className="strip-scale"><span>{compactPkr(lo)}</span><span>{compactPkr((lo + hi) / 2)}</span><span>{compactPkr(hi)}</span></div>
        <span />
      </div>
      {sorted.map((r) => (
        <div className="strip-row" role="listitem" key={r.id}>
          <span className="strip-name"><i style={{ background: modelColor(r.id) }} />{r.name}</span>
          <div className="strip-track">
            <span className="strip-dot" style={{ left: `${at(r.value)}%`, background: modelColor(r.id) }} title={`${r.name}: ${pkr(r.value)}`} />
          </div>
          <span className="strip-val">{compactPkr(r.value)}</span>
        </div>
      ))}
    </div>
  );
}
