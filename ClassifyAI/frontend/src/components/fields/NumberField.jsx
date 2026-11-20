import { clamp } from "../../utils/format";

// A number box, optionally paired with a slider. `stats` = { min, max, median } from GET /options.
export default function NumberField({ id, label, hint, value, onChange, stats, slider = false, sliderStep = 1, error, warning }) {
  const n = Number(value);
  const sliderValue = value === "" || Number.isNaN(n) ? stats.median : clamp(n, stats.min, stats.max);
  const note = error || warning || hint;
  const range = `${stats.min.toLocaleString()} to ${stats.max.toLocaleString()} in the training data`;

  return (
    <div className={`field${error ? " has-error" : ""}${!error && warning ? " has-warning" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id} type="number" inputMode="decimal" step="any"
        value={value} onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)} aria-describedby={`${id}-note`}
      />
      {slider && (
        <input
          type="range" className="slider" aria-label={`${label}, slider`}
          min={stats.min} max={stats.max} step={sliderStep} value={sliderValue}
          onChange={(e) => onChange(e.target.value)}
          style={{ "--fill": `${((sliderValue - stats.min) / (stats.max - stats.min || 1)) * 100}%` }}
        />
      )}
      <p className="field-note" id={`${id}-note`}>
        {note || range}
        {note && !error && !warning && <span className="field-range"> {range}.</span>}
      </p>
    </div>
  );
}
