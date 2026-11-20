import { ESSENTIALS, FIELD_HINTS, MODEL_NOTES, OPTIONAL_GROUPS, PRESETS, fieldLabel } from "../labels";
import { countFilled, rangeWarning } from "../utils/payload";
import ChoiceField from "./fields/ChoiceField";
import NumberField from "./fields/NumberField";
import Icon from "./Icon";

const SLIDERS = { Experience_Years: 1, Performance_Rating: 0.1, Job_Grade: 1, Working_Hours_Per_Week: 1 };

export default function InputForm({
  options, models, values, setValues, errors, busy,
  onSubmit, onCompareAll, onPreset, onReset,
}) {
  const set = (name) => (v) => setValues((cur) => ({ ...cur, [name]: v }));

  const allColumns = [...Object.keys(options.numeric), ...Object.keys(options.categorical)];
  const known = new Set([...ESSENTIALS, ...OPTIONAL_GROUPS.flatMap((g) => g.fields)]);
  const extra = allColumns.filter((c) => !known.has(c));
  const groups = [
    ...OPTIONAL_GROUPS.map((g) => ({ ...g, fields: g.fields.filter((f) => allColumns.includes(f)) })),
    { id: "other", title: "Other details", hint: "", fields: extra },
  ].filter((g) => g.fields.length);

  function renderField(col, optional) {
    if (options.numeric[col]) {
      return (
        <NumberField
          key={col} id={col} label={fieldLabel(col)} hint={FIELD_HINTS[col]}
          stats={options.numeric[col]} value={values[col]} onChange={set(col)}
          slider={col in SLIDERS && !optional} sliderStep={SLIDERS[col]} optional={optional}
          error={errors[col]} warning={rangeWarning(col, values[col], options)}
        />
      );
    }
    return (
      <ChoiceField
        key={col} id={col} column={col} label={fieldLabel(col)} optional={optional}
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
          <p className="field-note">{MODEL_NOTES[values.model] ?? "Chosen model used for this estimate."}</p>
        </div>
        <div className="presets" role="group" aria-label="Quick fill">
          <span className="presets-label">Quick fill</span>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button type="button" key={key} className="chip-btn" onClick={() => onPreset(key)}>{p.label}</button>
          ))}
          <button type="button" className="chip-btn" onClick={onReset}>Reset</button>
        </div>
      </div>

      <section className="form-section" aria-labelledby="sec-core">
        <div className="form-section-head">
          <h2 id="sec-core">Essentials</h2>
          <p>The five details every estimate needs.</p>
        </div>
        <div className="form-grid">{ESSENTIALS.map((c) => renderField(c, false))}</div>
      </section>

      <div className="optional-intro">
        <h2>Optional details</h2>
        <p>Leave a field on <strong>Auto</strong> and the model uses the typical value from its training data. Each detail you add can sharpen the estimate.</p>
      </div>

      {groups.map((g) => {
        const filled = countFilled(g.fields, values);
        return (
          <details className="optional" key={g.id} open={filled > 0}>
            <summary>
              <span className="optional-title">
                <strong>{g.title}</strong>
                {g.hint && <small>{g.hint}</small>}
              </span>
              <span className={`optional-count${filled ? " is-set" : ""}`}>{filled ? `${filled} of ${g.fields.length} set` : `${g.fields.length} fields on Auto`}</span>
              <Icon name="chevron" size={18} className="optional-chevron" />
            </summary>
            <div className="form-grid optional-grid">{g.fields.map((c) => renderField(c, true))}</div>
          </details>
        );
      })}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy !== null}>
          <Icon name="wallet" size={17} />
          {busy === "predict" ? "Estimating\u2026" : "Estimate salary"}
        </button>
        <button type="button" className="btn" disabled={busy !== null} onClick={onCompareAll}>
          <Icon name="layers" size={17} />
          {busy === "all" ? "Comparing\u2026" : "Compare all models"}
        </button>
        <span className="form-hint"><kbd>Ctrl</kbd> <kbd>Enter</kbd> to estimate</span>
      </div>
    </form>
  );
}
