import { valueLabel } from "../../labels";
import Segmented from "../Segmented";

const AUTO = "Auto";

// Few choices -> buttons you can see all at once. Many choices -> a dropdown.
// An optional field gets an extra "Auto" choice, which means "let the model use the typical value".
export default function ChoiceField({ id, column, label, choices, value, onChange, optional = false }) {
  const useButtons = choices.length <= 4;

  if (useButtons) {
    const options = choices.map((c) => ({ value: c, label: valueLabel(column, c) }));
    if (optional) options.unshift({ value: "", label: AUTO });
    return (
      <div className={`field${options.length > 3 ? " field-wide" : ""}`}>
        <span className="field-label" id={`${id}-label`}>{label}</span>
        <Segmented className="segmented-wrap" label={label} value={value} onChange={onChange} options={options} />
      </div>
    );
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="select-wrap">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {optional && <option value="">Auto (typical value)</option>}
          {choices.map((c) => <option key={String(c)} value={c}>{valueLabel(column, c)}</option>)}
        </select>
      </div>
    </div>
  );
}
