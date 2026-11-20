import ProbabilityStrip from "../charts/ProbabilityStrip";
import { modelColor } from "../labels";
import { pct } from "../utils/format";
import EmptyState from "./EmptyState";

export default function AllModelsResult({ results, loading, onRun, modelName, disabled }) {
  if (!results) {
    return (
      <EmptyState icon="layers" title={loading ? "Scoring with every model…" : "See how much the models agree"}
        action={!loading && <button className="btn btn-sm" onClick={onRun} disabled={disabled}>Compare all models</button>}>
        {loading ? "This takes a moment." : "Runs the same application through every trained model and plots the answers on one scale."}
      </EmptyState>
    );
  }

  const probs = results.map((r) => r.default_probability);
  const spread = Math.max(...probs) - Math.min(...probs);
  const votes = results.filter((r) => r.prediction === "Default").length;

  return (
    <div className="all-models">
      <ProbabilityStrip rows={results.map((r) => ({ id: r.model, name: modelName(r.model), probability: r.default_probability }))} />
      <p className="result-note">
        <strong>{votes} of {results.length}</strong> models predict default. The answers span {(spread * 100).toFixed(1)} percentage points.
        {spread > 0.4 && " The models disagree a lot on this input, so treat the result with caution."}
      </p>
      <table className="mini-table">
        <thead><tr><th>Model</th><th>Verdict</th><th className="num">Probability</th></tr></thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.model}>
              <td><i className="dot" style={{ background: modelColor(r.model) }} />{modelName(r.model)}</td>
              <td><span className={`badge band-${r.risk_level.toLowerCase()}`}>{r.prediction}</span></td>
              <td className="num">{pct(r.default_probability)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
