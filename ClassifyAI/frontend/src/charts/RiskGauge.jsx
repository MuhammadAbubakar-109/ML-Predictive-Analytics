import useAnimatedNumber from "../hooks/useAnimatedNumber";
import { DECISION, LOW_BELOW, MEDIUM_BELOW, riskBand } from "../utils/risk";

// A 240-degree dial. 0% is at the lower left, 100% at the lower right.
const CX = 160;
const CY = 168;
const R = 104;
const START = 150; // degrees, measured clockwise from "3 o'clock"
const SWEEP = 240;

const point = (r, v) => {
  const a = ((START + SWEEP * v) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

function arc(r, from, to) {
  const [x0, y0] = point(r, from);
  const [x1, y1] = point(r, to);
  const large = (to - from) * SWEEP > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

const TICKS = Array.from({ length: 21 }, (_, i) => i / 20);

export default function RiskGauge({ value, loading = false }) {
  const idle = value == null;
  const shown = useAnimatedNumber(idle ? 0 : value);
  const band = riskBand(shown);
  const [kx, ky] = point(R, shown);
  const [dx0, dy0] = point(R - 13, DECISION);
  const [dx1, dy1] = point(R + 13, DECISION);

  return (
    <svg
      viewBox="0 0 320 262"
      className={`gauge band-${band}${idle ? " is-idle" : ""}${loading ? " is-loading" : ""}`}
      role="img"
      aria-label={idle ? "Risk gauge, no result yet" : `Default probability ${(value * 100).toFixed(1)} percent`}
    >
      {/* coloured risk zones, matching the backend risk levels */}
      <path d={arc(R + 17, 0, LOW_BELOW)} className="gauge-zone zone-low" />
      <path d={arc(R + 17, LOW_BELOW, MEDIUM_BELOW)} className="gauge-zone zone-medium" />
      <path d={arc(R + 17, MEDIUM_BELOW, 1)} className="gauge-zone zone-high" />

      {/* tick marks */}
      {TICKS.map((v, i) => {
        const major = i % 5 === 0;
        const [x0, y0] = point(R + 26, v);
        const [x1, y1] = point(R + (major ? 36 : 31), v);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} className={`gauge-tick${major ? " is-major" : ""}`} />;
      })}
      {[0, 0.5, 1].map((v) => {
        const [x, y] = point(R + 50, v);
        return (
          <text key={v} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="gauge-label">
            {v * 100}
          </text>
        );
      })}

      {/* track and value */}
      <path d={arc(R, 0, 1)} className="gauge-track" />
      {!idle && shown > 0.004 && <path d={arc(R, 0, shown)} className="gauge-value" />}

      {/* the 50% decision line */}
      <line x1={dx0} y1={dy0} x2={dx1} y2={dy1} className="gauge-decision" />

      {!idle && <circle cx={kx} cy={ky} r="9.5" className="gauge-knob" />}

      <text x={CX} y={CY + 6} textAnchor="middle" className="gauge-number">
        {idle ? "\u2013" : (shown * 100).toFixed(1)}
        {!idle && <tspan className="gauge-unit">%</tspan>}
      </text>
      <text x={CX} y={CY + 34} textAnchor="middle" className="gauge-caption">
        {idle ? "chance of default" : "chance of default"}
      </text>
    </svg>
  );
}
