import RiskGauge from "../charts/RiskGauge";
import { API_BASE } from "../services/api";
import { buildCurl } from "../utils/curl";
import { copyText } from "../utils/csv";
import { pct } from "../utils/format";
import { useToast } from "../context/ToastContext";
import Icon from "./Icon";

export default function PredictionResult({ result, previous, loading, loadingModel, modelName, payload }) {
  const toast = useToast();

  if (loading) {
    return (
      <div className="result">
        <RiskGauge value={null} loading />
        <p className="result-note" aria-live="polite">Scoring with {loadingModel}…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result">
        <RiskGauge value={null} />
        <p className="result-note">Fill in the form and choose <strong>Assess risk</strong>. The dial shows the model&rsquo;s estimated chance that this loan defaults.</p>
      </div>
    );
  }

  const p = result.default_probability;
  const isDefault = result.prediction === "Default";
  const band = result.risk_level.toLowerCase();
  const delta = previous && previous.model === result.model ? p - previous.probability : null;

  async function copy(text, what) {
    const ok = await copyText(text);
    if (ok) toast.success(`${what} copied`);
    else toast.error("Copy failed. Your browser blocked clipboard access.");
  }

  return (
    <div className="result">
      <RiskGauge value={p} />
      <div className="verdict-row" aria-live="polite">
        <span className={`verdict ${isDefault ? "is-bad" : "is-good"}`}>
          {isDefault ? "Predicted to default" : "Predicted to repay"}
        </span>
        <span className={`badge band-${band}`}>{result.risk_level} risk</span>
      </div>
      <p className="result-note">
        {pct(p)} probability of default, {isDefault ? "at or above" : "below"} the 50% decision line.
        This is a statistical estimate from past loans, not a credit decision.
      </p>

      <dl className="facts">
        <div><dt>Model</dt><dd>{modelName(result.model)}</dd></div>
        <div>
          <dt>Since last run</dt>
          <dd>
            {delta == null ? "First run with this model" : (
              <span className={`delta ${delta > 0.0005 ? "is-up" : delta < -0.0005 ? "is-down" : ""}`}>
                <Icon name={delta >= 0 ? "up" : "down"} size={14} />
                {Math.abs(delta * 100).toFixed(1)} points
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="result-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => copy(buildCurl(API_BASE, "/predict", payload), "cURL command")}>
          <Icon name="terminal" size={15} /> Copy as cURL
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => copy(JSON.stringify({ request: payload, response: result }, null, 2), "JSON")}>
          <Icon name="copy" size={15} /> Copy JSON
        </button>
      </div>
    </div>
  );
}
