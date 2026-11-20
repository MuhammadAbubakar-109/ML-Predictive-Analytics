import { valueLabel } from "../../labels";
import Segmented from "../Segmented";

// Few choices -> buttons you can see all at once. Many choices -> a dropdown.
export default function ChoiceField({ id, column, label, choices, value, onChange }) {
  const useButtons = choices.length <= 4;
  const wide = useButtons && choices.length > 2;

  if (useButtons) {
    return (
      <div className={`field${wide ? " field-wide" : ""}`}>
        <span className="field-label" id={`${id}-label`}>{label}</span>
        <Segmented
          className="segmented-wrap" label={label} value={value} onChange={onChange}
          options={choices.map((c) => ({ value: c, label: valueLabel(column, c) }))}
        />
      </div>
    );
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="select-wrap">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {choices.map((c) => <option key={String(c)} value={c}>{valueLabel(column, c)}</option>)}
        </select>
      </div>
    </div>
  );
}
