import { pct } from "../utils/format";
import { modelColor } from "../labels";

// One dot per model on a shared 0-100% axis, so disagreement is visible at a glance.
export default function ProbabilityStrip({ rows }) {
  const sorted = [...rows].sort((a, b) => b.probability - a.probability);
  return (
    <div className="strip" role="list" aria-label="Default probability by model">
      <div className="strip-axis" aria-hidden="true">
        <span />
        <div className="strip-scale"><span>0%</span><span>50%</span><span>100%</span></div>
        <span />
      </div>
      {sorted.map((r) => (
        <div className="strip-row" role="listitem" key={r.id}>
          <span className="strip-name">
            <i style={{ background: modelColor(r.id) }} />
            {r.name}
          </span>
          <div className="strip-track">
            <span
              className="strip-dot"
              style={{ left: `${r.probability * 100}%`, background: modelColor(r.id) }}
              title={`${r.name}: ${pct(r.probability)}`}
            />
          </div>
          <span className="strip-val">{pct(r.probability)}</span>
        </div>
      ))}
    </div>
  );
}
