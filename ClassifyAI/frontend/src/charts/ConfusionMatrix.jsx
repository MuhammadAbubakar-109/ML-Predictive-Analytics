import { num, pct } from "../utils/format";

// matrix = [[true no-default, false default], [missed default, true default]]
export default function ConfusionMatrix({ matrix }) {
  const [[tn, fp], [fn, tp]] = matrix;
  const noDefaults = tn + fp;
  const defaults = fn + tp;

  const cells = [
    { key: "tn", count: tn, rate: tn / noDefaults, good: true, title: "Cleared correctly" },
    { key: "fp", count: fp, rate: fp / noDefaults, good: false, title: "Flagged by mistake" },
    { key: "fn", count: fn, rate: fn / defaults, good: false, title: "Default missed" },
    { key: "tp", count: tp, rate: tp / defaults, good: true, title: "Default caught" },
  ];

  return (
    <div className="matrix">
      <span className="matrix-axis matrix-corner" aria-hidden="true" />
      <span className="matrix-axis">Predicted: no default</span>
      <span className="matrix-axis">Predicted: default</span>

      <span className="matrix-axis matrix-side">Actually repaid<br /><small>{num(noDefaults)} loans</small></span>
      {cells.slice(0, 2).map((c) => <Cell key={c.key} {...c} />)}

      <span className="matrix-axis matrix-side">Actually defaulted<br /><small>{num(defaults)} loans</small></span>
      {cells.slice(2).map((c) => <Cell key={c.key} {...c} />)}
    </div>
  );
}

function Cell({ count, rate, good, title }) {
  const strength = Math.round(12 + rate * 58);
  const tone = good ? "var(--low)" : "var(--high)";
  return (
    <div className="matrix-cell" style={{ background: `color-mix(in srgb, ${tone} ${strength}%, var(--surface))` }}>
      <span className="matrix-count">{num(count)}</span>
      <span className="matrix-rate">{pct(rate)} of row</span>
      <span className="matrix-title">{title}</span>
    </div>
  );
}
