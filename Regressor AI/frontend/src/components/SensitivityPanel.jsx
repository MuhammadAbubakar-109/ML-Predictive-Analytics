import { useEffect, useMemo, useState } from "react";
import CategoryBars from "../charts/CategoryBars";
import LineChart from "../charts/LineChart";
import { INTEGER_FIELDS, fieldLabel } from "../labels";
import { predictSalary } from "../services/api";
import { num, pkr } from "../utils/format";
import EmptyState from "./EmptyState";
import Icon from "./Icon";

const NUMERIC = ["Experience_Years", "Years_at_Company", "Industry_Experience_Years", "Certifications_Count", "Technical_Skills_Count", "Performance_Rating", "Job_Grade", "Working_Hours_Per_Week"];
const CHOICES = ["Job_Level", "Education_Level", "City", "Company_Type", "Company_Size", "Remote_Work_Type"];
const STEPS = 9;

// "What if only this one input were different?" Calls /predict once per step or per choice.
export default function SensitivityPanel({ payload, options, model, modelName }) {
  const numeric = NUMERIC.filter((c) => options.numeric[c]);
  const choices = CHOICES.filter((c) => options.categorical[c]?.length > 1 && options.categorical[c].length <= 12);
  const [variable, setVariable] = useState(numeric[0] ?? choices[0]);
  const [state, setState] = useState({ status: "idle", rows: [], key: "", error: "" });
  const isNumeric = Boolean(options.numeric[variable]);

  // A fingerprint of everything except the variable being changed. If it changes, the result is stale.
  const fingerprint = useMemo(
    () => (payload ? JSON.stringify({ ...payload, [variable]: null, model }) : ""),
    [payload, variable, model]
  );
  const stale = state.status === "done" && state.key !== fingerprint;

  useEffect(() => { setState({ status: "idle", rows: [], key: "", error: "" }); }, [variable]);

  if (!payload) {
    return (
      <EmptyState icon="sliders" title="Stress-test an estimate">
        Run an estimate first. Then you can change one detail at a time and see how the model&rsquo;s answer moves.
      </EmptyState>
    );
  }

  async function run() {
    let values;
    if (isNumeric) {
      const { min, max } = options.numeric[variable];
      const raw = Array.from({ length: STEPS }, (_, i) => min + ((max - min) * i) / (STEPS - 1));
      values = [...new Set(raw.map((v) => (INTEGER_FIELDS.has(variable) ? Math.round(v) : Math.round(v * 100) / 100)))];
    } else {
      values = options.categorical[variable];
    }
    setState({ status: "running", rows: [], key: fingerprint, error: "" });
    try {
      const answers = await Promise.all(values.map((v) => predictSalary({ ...payload, model, [variable]: v })));
      setState({ status: "done", key: fingerprint, error: "", rows: values.map((v, i) => ({ x: v, y: answers[i].monthly_salary_pkr })) });
    } catch (e) {
      setState({ status: "error", rows: [], key: "", error: e.message });
    }
  }

  const { rows } = state;
  const low = rows.length ? rows.reduce((a, b) => (b.y < a.y ? b : a)) : null;
  const high = rows.length ? rows.reduce((a, b) => (b.y > a.y ? b : a)) : null;
  const fmt = (v) => (typeof v === "number" ? num(v, Number.isInteger(v) ? 0 : 1) : String(v));
  const current = payload[variable];

  return (
    <div className="sensitivity">
      <div className="sens-controls">
        <div className="field">
          <label htmlFor="sens-var">Change only</label>
          <div className="select-wrap">
            <select id="sens-var" value={variable} onChange={(e) => setVariable(e.target.value)}>
              <optgroup label="Numbers">{numeric.map((v) => <option key={v} value={v}>{fieldLabel(v)}</option>)}</optgroup>
              <optgroup label="Choices">{choices.map((v) => <option key={v} value={v}>{fieldLabel(v)}</option>)}</optgroup>
            </select>
          </div>
        </div>
        <button className="btn btn-sm" onClick={run} disabled={state.status === "running"}>
          <Icon name="play" size={14} />
          {state.status === "running" ? "Running…" : rows.length ? "Run again" : "Run"}
        </button>
      </div>

      {state.status === "error" && <p className="inline-error">{state.error}</p>}

      {rows.length > 0 && (
        <>
          {stale && <p className="inline-warning">The inputs changed after this run. Run it again for current numbers.</p>}
          {isNumeric
            ? <LineChart points={rows} xLabel={fieldLabel(variable)} formatX={fmt} marker={current === undefined ? null : Number(current)} />
            : <CategoryBars rows={rows.map((r) => ({ label: r.x, value: r.y }))} current={current} />}
          <p className="result-note">
            With {modelName(model)}, the estimate is lowest at <strong>{fmt(low.x)}</strong> ({pkr(low.y)}) and highest
            at <strong>{fmt(high.x)}</strong> ({pkr(high.y)}). Each result scores the full profile with only this detail changed.
          </p>
        </>
      )}
      {state.status === "idle" && (
        <p className="result-note">
          {isNumeric
            ? `Scores up to ${STEPS} values spread across the range in the training data.`
            : `Scores every ${fieldLabel(variable).toLowerCase()} option in the training data.`}
          {" "}It shows how this model behaves, not what would happen to a real person.
        </p>
      )}
    </div>
  );
}
