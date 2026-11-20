import useAnimatedNumber from "../hooks/useAnimatedNumber";
import { compactPkr, pkr } from "../utils/format";

const W = 340;
const H = 126;
const PAD = 14;
const TRACK_Y = 62;

// A horizontal scale from PKR 0 upward. Shows the estimate, its typical range, and the dataset average.
export default function SalaryRuler({ value, low, high, mean }) {
  const idle = value == null;
  const v = useAnimatedNumber(idle ? 0 : value, 900);
  const lo = useAnimatedNumber(idle ? 0 : low, 900);
  const hi = useAnimatedNumber(idle ? 0 : high, 900);

  // Round the right-hand end of the scale up to a tidy number.
  const top = Math.max(idle ? 0 : high, mean || 0, 1) * 1.18;
  const step = Math.pow(10, Math.floor(Math.log10(top))) / 2;
  const max = Math.ceil(top / step) * step;
  const x = (n) => PAD + (Math.min(n, max) / max) * (W - PAD * 2);
  const ticks = [0, 0.5, 1].map((t) => t * max);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`ruler${idle ? " is-idle" : ""}`} role="img"
      aria-label={idle ? "Salary scale, no estimate yet" : `Estimate ${pkr(value)} per month, typical range ${pkr(low)} to ${pkr(high)}`}>
      <line x1={PAD} x2={W - PAD} y1={TRACK_Y} y2={TRACK_Y} className="ruler-track" />

      {!idle && <rect x={x(lo)} y={TRACK_Y - 9} width={Math.max(x(hi) - x(lo), 2)} height="18" rx="9" className="ruler-band" />}

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={x(t)} x2={x(t)} y1={TRACK_Y + 14} y2={TRACK_Y + 20} className="ruler-tick" />
          <text x={x(t)} y={TRACK_Y + 34} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} className="ruler-label">
            {i === 0 ? "0" : compactPkr(t)}
          </text>
        </g>
      ))}

      {mean > 0 && (
        <g>
          <line x1={x(mean)} x2={x(mean)} y1={TRACK_Y - 20} y2={TRACK_Y + 12} className="ruler-mean" />
          <text x={x(mean)} y={TRACK_Y - 26} textAnchor={x(mean) > W * 0.7 ? "end" : "middle"} className="ruler-label">
            average {compactPkr(mean)}
          </text>
        </g>
      )}

      {!idle && <circle cx={x(v)} cy={TRACK_Y} r="9" className="ruler-dot" />}
      {!idle && (
        <text x={Math.min(Math.max((x(lo) + x(hi)) / 2, 54), W - 54)} y={TRACK_Y + 56} textAnchor="middle" className="ruler-range">
          {compactPkr(lo)} to {compactPkr(hi)}
        </text>
      )}
    </svg>
  );
}
