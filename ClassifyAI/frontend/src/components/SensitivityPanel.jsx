import { useEffect, useMemo, useState } from "react";
import LineChart from "../charts/LineChart";
import { fieldLabel } from "../labels";
import { predict } from "../services/api";
import { num, pct } from "../utils/format";
import EmptyState from "./EmptyState";
import Icon from "./Icon";

const CANDIDATES = ["Credit_Score", "dtir1", "income", "loan_amount", "term"];
const STEPS = 9;

// "What if only this one input were different?" Calls /predict once per step.
export default function SensitivityPanel({ payload, options, model, modelName }) {
  const variables = CANDIDATES.filter((c) => options.numeric[c]);
  const [variable, setVariable] = useState(variables[0]);
  const [state, setState] = useState({ status: "idle", points: [], key: "", error: "" });

  // A fingerprint of everything except the variable being swept. If it changes, the sweep is stale.
  const fingerprint = useMemo(
    () => (payload ? JSON.stringify({ ...payload, [variable]: null, model }) : ""),
    [payload, variable, model]
  );
  const stale = state.status === "done" && state.key !== fingerprint;

  useEffect(() => { setState({ status: "idle", points: [], key: "", error: "" }); }, [variable]);

  if (!payload) {
    return (
      <EmptyState icon="sliders" title="Stress-test an assessment">
        Run an assessment first. Then you can change one input at a time and see how the model&rsquo;s answer moves.
      </EmptyState>
    );
  }

  async function run() {
    const { min, max } = options.numeric[variable];
    const xs = Array.from({ length: STEPS }, (_, i) => {
      const v = min + ((max - min) * i) / (STEPS - 1);
      return variable === "Credit_Score" ? Math.round(v) : Math.round(v * 100) / 100;
    });
    setState({ status: "running", points: [], key: fingerprint, error: "" });
    try {
      const results = await Promise.all(xs.map((x) => predict({ ...payload, model, [variable]: x })));
      setState({
        status: "done", key: fingerprint, error: "",
        points: xs.map((x, i) => ({ x, y: results[i].default_probability })),
      });
    } catch (e) {
      setState({ status: "error", points: [], key: "", error: e.message });
    }
  }

  const { points } = state;
  const low = points.length ? points.reduce((a, b) => (b.y < a.y ? b : a)) : null;
  const high = points.length ? points.reduce((a, b) => (b.y > a.y ? b : a)) : null;
  const fmt = (v) => (variable === "Credit_Score" || variable === "term" ? num(v) : v >= 1000 ? num(v) : num(v, 1));

  return (
    <div className="sensitivity">
      <div className="sens-controls">
        <div className="field">
          <label htmlFor="sens-var">Change only</label>
          <div className="select-wrap">
            <select id="sens-var" value={variable} onChange={(e) => setVariable(e.target.value)}>
              {variables.map((v) => <option key={v} value={v}>{fieldLabel(v)}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-sm" onClick={run} disabled={state.status === "running"}>
          <Icon name="play" size={14} />
          {state.status === "running" ? "Running…" : points.length ? "Run again" : "Run sweep"}
        </button>
      </div>

      {state.status === "error" && <p className="inline-error">{state.error}</p>}

      {points.length > 0 && (
        <>
          {stale && <p className="inline-warning">The inputs changed after this sweep. Run it again for current numbers.</p>}
          <LineChart points={points} xLabel={fieldLabel(variable)} formatX={fmt} marker={Number(payload[variable])} />
          <p className="result-note">
            With {modelName(model)}, risk is lowest at <strong>{fmt(low.x)}</strong> ({pct(low.y)}) and highest
            at <strong>{fmt(high.x)}</strong> ({pct(high.y)}). Each point scores the full application with only
            this input changed.
          </p>
        </>
      )}
      {state.status === "idle" && (
        <p className="result-note">
          Scores {STEPS} values spread across the range in the training data and plots the result. It shows how this
          model behaves, not what would happen to a real borrower.
        </p>
      )}
    </div>
  );
}
