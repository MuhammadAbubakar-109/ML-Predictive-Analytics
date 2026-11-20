import SalaryRuler from "../charts/SalaryRuler";
import useAnimatedNumber from "../hooks/useAnimatedNumber";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { API_BASE } from "../services/api";
import { copyText } from "../utils/csv";
import { buildCurl } from "../utils/curl";
import { num, pkr } from "../utils/format";
import Icon from "./Icon";

export default function PredictionResult({ result, previous, loading, loadingModel, modelName, payload }) {
  const toast = useToast();
  const { info } = useApp();
  const shown = useAnimatedNumber(result ? result.monthly_salary_pkr : 0, 800);

  if (loading) {
    return (
      <div className="result">
        <SalaryRuler value={null} mean={info.target_mean} />
        <p className="result-note" aria-live="polite">Estimating with {loadingModel}…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result">
        <p className="figure is-idle"><span>PKR</span>–<small>per month</small></p>
        <SalaryRuler value={null} mean={info.target_mean} />
        <p className="result-note">Fill in the five essentials and choose <strong>Estimate salary</strong>. Each optional detail you add can sharpen the answer.</p>
      </div>
    );
  }

  const mean = info.target_mean;
  const vsMean = mean ? result.monthly_salary_pkr / mean - 1 : null;
  const delta = previous && previous.model === result.model ? result.monthly_salary_pkr - previous.value : null;

  async function copy(text, what) {
    const ok = await copyText(text);
    if (ok) toast.success(`${what} copied`);
    else toast.error("Copy failed. Your browser blocked clipboard access.");
  }

  return (
    <div className="result">
      <p className="figure" aria-live="polite">
        <span>PKR</span>{num(shown)}<small>per month</small>
      </p>
      <p className="figure-sub">about {pkr(result.annual_salary_pkr)} per year</p>

      <SalaryRuler value={result.monthly_salary_pkr} low={result.range_low_pkr} high={result.range_high_pkr} mean={mean} />

      <p className="result-note">
        Typical range <strong>{num(result.range_low_pkr)} to {num(result.range_high_pkr)}</strong>: the estimate plus or minus this model&rsquo;s average error on test data. Real salaries can fall outside it.
      </p>

      <dl className="facts">
        <div><dt>Model</dt><dd>{modelName(result.model)}</dd></div>
        {vsMean != null && (
          <div>
            <dt>Against the average in the data</dt>
            <dd>{vsMean >= 0 ? "+" : "\u2212"}{Math.abs(vsMean * 100).toFixed(0)}%</dd>
          </div>
        )}
        <div>
          <dt>Since last run</dt>
          <dd>
            {delta == null ? "First run with this model" : (
              <span className="delta">
                <Icon name={delta >= 0 ? "up" : "down"} size={14} />
                {pkr(Math.abs(delta))}
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
