import { FIELD_GROUPS, FIELD_HINTS, MODEL_NOTES, fieldLabel } from "../labels";
import { PRESETS, rangeWarning } from "../utils/payload";
import { num } from "../utils/format";
import ChoiceField from "./fields/ChoiceField";
import NumberField from "./fields/NumberField";
import Icon from "./Icon";

const SLIDERS = { Credit_Score: 1, dtir1: 1, term: 12 };

export default function InputForm({
  options, models, values, setValues, errors, busy,
  onSubmit, onCompareAll, onPreset, onReset,
}) {
  const set = (name) => (v) => setValues((cur) => ({ ...cur, [name]: v }));

  const allColumns = [...Object.keys(options.numeric), ...Object.keys(options.categorical)];
  const known = new Set(FIELD_GROUPS.flatMap((g) => g.fields));
  const extra = allColumns.filter((c) => !known.has(c));
  const groups = [
    ...FIELD_GROUPS.map((g) => ({ ...g, fields: g.fields.filter((f) => allColumns.includes(f)) })),
    { id: "other", title: "Other details", hint: "", fields: extra },
  ].filter((g) => g.fields.length);

  const income = Number(values.income);
  const loan = Number(values.loan_amount);
  const ratio = income > 0 && loan > 0 ? loan / income : null;

  function renderField(col) {
    if (options.numeric[col]) {
      return (
        <NumberField
          key={col} id={col} label={fieldLabel(col)} hint={FIELD_HINTS[col]}
          stats={options.numeric[col]} value={values[col]} onChange={set(col)}
          slider={col in SLIDERS} sliderStep={SLIDERS[col]}
          error={errors[col]} warning={rangeWarning(col, values[col], options)}
        />
      );
    }
    return (
      <ChoiceField
        key={col} id={col} column={col} label={fieldLabel(col)}
        choices={options.categorical[col]} value={values[col]} onChange={set(col)}
      />
    );
  }

  return (
    <form className="sheet" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} noValidate>
      <div className="sheet-top">
        <div className="field">
          <label htmlFor="model">Model</label>
          <div className="select-wrap">
            <select id="model" value={values.model} onChange={(e) => set("model")(e.target.value)}>
              {models.models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.is_best ? " (best)" : ""}</option>
              ))}
            </select>
          </div>
          <p className="field-note">{MODEL_NOTES[values.model] ?? "Chosen model used for this assessment."}</p>
        </div>
        <div className="presets" role="group" aria-label="Quick fill">
          <span className="presets-label">Quick fill</span>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button type="button" key={key} className="chip-btn" onClick={() => onPreset(key)}>{p.label}</button>
          ))}
          <button type="button" className="chip-btn" onClick={onReset}>Typical values</button>
        </div>
      </div>

      {groups.map((g) => (
        <section className="form-section" key={g.id} aria-labelledby={`sec-${g.id}`}>
          <div className="form-section-head">
            <h2 id={`sec-${g.id}`}>{g.title}</h2>
            {g.hint && <p>{g.hint}</p>}
          </div>
          <div className="form-grid">
            {g.fields.map(renderField)}
            {g.id === "loan" && ratio != null && (
              <p className="derived">
                Loan-to-income ratio <strong>{num(ratio, 1)}×</strong> monthly income. The models calculate this themselves as an extra signal.
              </p>
            )}
          </div>
        </section>
      ))}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy !== null}>
          <Icon name="gauge" size={17} />
          {busy === "predict" ? "Scoring\u2026" : "Assess risk"}
        </button>
        <button type="button" className="btn" disabled={busy !== null} onClick={onCompareAll}>
          <Icon name="layers" size={17} />
          {busy === "all" ? "Comparing\u2026" : "Compare all models"}
        </button>
        <span className="form-hint"><kbd>Ctrl</kbd> <kbd>Enter</kbd> to assess</span>
      </div>
    </form>
  );
}
